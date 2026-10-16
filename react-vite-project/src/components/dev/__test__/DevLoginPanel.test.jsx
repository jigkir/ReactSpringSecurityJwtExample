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

    it('shouldListEveryUserAsNameAndRoleOption', async () => {
        getDevUsers.mockResolvedValue(USERS);

        renderPanel();

        expect(await screen.findByRole('option', {name: 'Alex Tremblay (STUDENT)'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Sarah Lin (MANAGER)'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: '-- Sélectionnez un utilisateur --'})).toBeInTheDocument();
    });

    it('shouldShowEmptyMessageWhenNoMockUsersExist', async () => {
        getDevUsers.mockResolvedValue([]);

        renderPanel();

        expect(await screen.findByText('Aucun utilisateur fictif disponible.')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
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

        expect(await screen.findByRole('option', {name: 'Alex Tremblay (STUDENT)'})).toBeInTheDocument();

        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        expect(getDevUsers).toHaveBeenCalledTimes(2);
    });
});