import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import DevLoginPanel from '../DevLoginPanel.jsx';
import {getDevUsers} from '../../api/DevApi.jsx';

vi.mock('../../api/DevApi.jsx', () => ({
    getDevUsers: vi.fn(),
    devLoginAs: vi.fn(),
}));

const USERS = [
    {id: 1, email: 'student@x.com', firstName: 'Alex', lastName: 'Tremblay', role: 'STUDENT'},
    {id: 2, email: 'manager@x.com', firstName: 'Sarah', lastName: 'Lin', role: 'MANAGER'},
];

const MIXED_USERS = [
    {id: 1, email: 'emp@x.com', firstName: 'Emp', lastName: 'Loyer', role: 'EMPLOYER', discipline: 'CIVIL_ENGINEERING'},
    {id: 2, email: 'teach@x.com', firstName: 'Teach', lastName: 'Er', role: 'TEACHER', discipline: 'MARKETING'},
    {id: 3, email: 'zed@x.com', firstName: 'Zed', lastName: 'Zimmer', role: 'STUDENT', discipline: 'NURSING'},
    {id: 4, email: 'amy@x.com', firstName: 'Amy', lastName: 'Adams', role: 'STUDENT', discipline: 'COMPUTER_SCIENCE'},
    {id: 5, email: 'boss@x.com', firstName: 'John', lastName: 'Doe', role: 'MANAGER'},
    {id: 6, email: 'bob@x.com', firstName: 'Bob', lastName: 'Baker', role: 'STUDENT', discipline: 'COMPUTER_SCIENCE'},
    {id: 7, email: 'emp2@x.com', firstName: 'Eva', lastName: 'Employer', role: 'EMPLOYER', discipline: 'COMPUTER_SCIENCE'},
];

const renderPanel = (onSelect = vi.fn()) => {
    render(
        <DevLoginPanel
            dark={false}
            fieldClass="field"
            labelClass="label"
            errorClass="error"
            onSelect={onSelect}
        />
    );
    return onSelect;
};

const groupLabels = () => screen.getAllByRole('group').map((g) => g.getAttribute('label'));

beforeEach(() => {
    vi.resetAllMocks();
});

describe('DevLoginPanel loading and display', () => {
    it('shouldShowSkeletonWhileUsersAreLoading', () => {
        getDevUsers.mockReturnValue(new Promise(() => {}));

        renderPanel();

        expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('shouldRenderPanelTitleAsLabelledRegion', async () => {
        getDevUsers.mockResolvedValue(USERS);

        renderPanel();

        expect(screen.getByRole('region', {name: 'Mode Dev : remplir la connexion'})).toBeInTheDocument();
        await screen.findByRole('combobox');
    });

    it('shouldListEveryUserByNameInsideItsRoleGroup', async () => {
        getDevUsers.mockResolvedValue(USERS);

        renderPanel();

        expect(await screen.findByRole('option', {name: 'Alex Tremblay'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Sarah Lin'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: '-- Sélectionnez un utilisateur --'})).toBeInTheDocument();
        expect(groupLabels()).toEqual(['MANAGER', 'STUDENT']);
    });

    it('shouldShowEmptyMessageWhenNoMockUsersExist', async () => {
        getDevUsers.mockResolvedValue([]);

        renderPanel();

        expect(await screen.findByText('Aucun utilisateur fictif disponible.')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
});

describe('DevLoginPanel grouping by role and discipline', () => {
    it('shouldGroupByRoleThenByDiscipline', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();
        await screen.findByRole('combobox');

        expect(groupLabels()).toEqual([
            'MANAGER',
            'STUDENT · Informatique',
            'STUDENT · Soins infirmiers',
            'TEACHER · Marketing',
            'EMPLOYER · Génie civil',
            'EMPLOYER · Informatique',
        ]);
    });

    it('shouldPutUsersOfTheSameRoleAndDisciplineInTheSameGroupSortedByLastName', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();
        await screen.findByRole('combobox');

        const studentCs = screen.getByRole('group', {name: 'STUDENT · Informatique'});
        const names = Array.from(studentCs.querySelectorAll('option')).map((o) => o.textContent);
        expect(names).toEqual(['Amy Adams', 'Bob Baker']);
    });

    it('shouldKeepTheOverallOptionOrderRoleThenDisciplineThenName', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();
        await screen.findByRole('combobox');

        const labels = screen.getAllByRole('option').map((o) => o.textContent);
        expect(labels).toEqual([
            '-- Sélectionnez un utilisateur --',
            'John Doe',
            'Amy Adams',
            'Bob Baker',
            'Zed Zimmer',
            'Teach Er',
            'Emp Loyer',
            'Eva Employer',
        ]);
    });

    it('shouldShowOnlyRoleInGroupLabelWhenUsersHaveNoDiscipline', async () => {
        getDevUsers.mockResolvedValue([MIXED_USERS[4]]);

        renderPanel();
        await screen.findByRole('combobox');

        expect(groupLabels()).toEqual(['MANAGER']);
    });

    it('shouldFallBackToRawDisciplineWhenNoTranslationExists', async () => {
        getDevUsers.mockResolvedValue([
            {id: 6, email: 'x@x.com', firstName: 'X', lastName: 'Y', role: 'STUDENT', discipline: 'UNKNOWN_FIELD'},
        ]);

        renderPanel();
        await screen.findByRole('combobox');

        expect(groupLabels()).toEqual(['STUDENT · UNKNOWN_FIELD']);
    });

    it('shouldCallOnSelectWithTheRightUserAfterGrouping', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);
        const onSelect = renderPanel();
        const select = await screen.findByRole('combobox');

        fireEvent.change(select, {target: {value: 'amy@x.com'}});

        expect(onSelect).toHaveBeenCalledWith(MIXED_USERS[3]);
    });
});

describe('DevLoginPanel selection', () => {
    it('shouldCallOnSelectWithTheChosenUser', async () => {
        getDevUsers.mockResolvedValue(USERS);
        const onSelect = renderPanel();
        const select = await screen.findByRole('combobox');

        fireEvent.change(select, {target: {value: 'manager@x.com'}});

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(USERS[1]);
        expect(select).toHaveValue('manager@x.com');
    });

    it('shouldCallOnSelectWithNullWhenSelectionIsCleared', async () => {
        getDevUsers.mockResolvedValue(USERS);
        const onSelect = renderPanel();
        const select = await screen.findByRole('combobox');
        fireEvent.change(select, {target: {value: 'student@x.com'}});

        fireEvent.change(select, {target: {value: ''}});

        expect(onSelect).toHaveBeenLastCalledWith(null);
    });
});

describe('DevLoginPanel errors', () => {
    it('shouldShowErrorAlertAndRetryButtonWhenLoadFails', async () => {
        getDevUsers.mockRejectedValue(new Error('boom'));

        renderPanel();

        expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les utilisateurs fictifs.');
        expect(screen.getByRole('button', {name: 'Réessayer'})).toBeInTheDocument();
    });

    it('shouldReloadUsersWhenRetryIsClicked', async () => {
        getDevUsers
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce(USERS);
        renderPanel();
        fireEvent.click(await screen.findByRole('button', {name: 'Réessayer'}));

        expect(await screen.findByRole('option', {name: 'Alex Tremblay'})).toBeInTheDocument();

        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        expect(getDevUsers).toHaveBeenCalledTimes(2);
    });
});