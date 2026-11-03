import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import DevLoginPanel, {roleHeader} from '../DevLoginPanel.jsx';
import {getDevUsers} from '../../api/DevApi.jsx';
import i18n from '../../../i18next.jsx';

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

// Every visible text goes through i18n, so these tests survive any rewording of the translations
const tr = (key) => i18n.t(key);
const discipline = (key) => i18n.t(`disciplines.${key}`);

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

describe('roleHeader', () => {
    it('shouldPutTheRoleBetweenTwoEqualRowsOfDashes', () => {
        const header = roleHeader('STUDENT');

        expect(header).toMatch(/^(-+) STUDENT \1$/);
    });

    it('shouldAlwaysKeepAtLeastThreeDashesOnEachSide', () => {
        const header = roleHeader('A_VERY_LONG_ROLE_NAME_THAT_EXCEEDS_THE_HEADER_WIDTH');

        expect(header.startsWith('--- ')).toBe(true);
        expect(header.endsWith(' ---')).toBe(true);
    });
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

        expect(screen.getByRole('region', {name: tr('dev.panelTitle')})).toBeInTheDocument();
        await screen.findByRole('combobox');
    });

    it('shouldListEveryUserByNameInsideItsRoleGroup', async () => {
        getDevUsers.mockResolvedValue(USERS);

        renderPanel();

        expect(await screen.findByRole('option', {name: 'Alex Tremblay'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Sarah Lin'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: tr('dev.selectPlaceholder')})).toBeInTheDocument();
        expect(groupLabels()).toEqual([roleHeader('MANAGER'), roleHeader('STUDENT')]);
    });

    it('shouldShowEmptyMessageWhenNoMockUsersExist', async () => {
        getDevUsers.mockResolvedValue([]);

        renderPanel();

        expect(await screen.findByText(tr('dev.empty'))).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
});

describe('DevLoginPanel grouping by role, sorted by discipline', () => {
    it('shouldGroupByRoleOnly', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();
        await screen.findByRole('combobox');

        expect(groupLabels()).toEqual([
            roleHeader('MANAGER'),
            roleHeader('STUDENT'),
            roleHeader('TEACHER'),
            roleHeader('EMPLOYER'),
        ]);
    });

    it('shouldShowTheDisciplineInParenthesesAfterTheName', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();

        expect(await screen.findByRole('option', {name: `Amy Adams (${discipline('computer_science')})`})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: `Zed Zimmer (${discipline('nursing')})`})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: `Emp Loyer (${discipline('civil_engineering')})`})).toBeInTheDocument();
    });

    it('shouldKeepUsersOfTheSameDisciplineTogetherInsideARole', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();
        await screen.findByRole('combobox');

        const students = screen.getByRole('group', {name: roleHeader('STUDENT')});
        const names = Array.from(students.querySelectorAll('option')).map((o) => o.textContent);
        expect(names).toEqual([
            `Amy Adams (${discipline('computer_science')})`,
            `Bob Baker (${discipline('computer_science')})`,
            `Zed Zimmer (${discipline('nursing')})`,
        ]);
    });

    it('shouldKeepTheOverallOptionOrderRoleThenDisciplineThenName', async () => {
        getDevUsers.mockResolvedValue(MIXED_USERS);

        renderPanel();
        await screen.findByRole('combobox');

        const labels = screen.getAllByRole('option').map((o) => o.textContent);
        expect(labels).toEqual([
            tr('dev.selectPlaceholder'),
            'John Doe',
            `Amy Adams (${discipline('computer_science')})`,
            `Bob Baker (${discipline('computer_science')})`,
            `Zed Zimmer (${discipline('nursing')})`,
            `Teach Er (${discipline('marketing')})`,
            `Emp Loyer (${discipline('civil_engineering')})`,
            `Eva Employer (${discipline('computer_science')})`,
        ]);
    });

    it('shouldShowNoParenthesesWhenUserHasNoDiscipline', async () => {
        getDevUsers.mockResolvedValue([MIXED_USERS[4]]);

        renderPanel();

        expect(await screen.findByRole('option', {name: 'John Doe'})).toBeInTheDocument();
        expect(groupLabels()).toEqual([roleHeader('MANAGER')]);
    });

    it('shouldFallBackToRawDisciplineWhenNoTranslationExists', async () => {
        getDevUsers.mockResolvedValue([
            {id: 6, email: 'x@x.com', firstName: 'X', lastName: 'Y', role: 'STUDENT', discipline: 'UNKNOWN_FIELD'},
        ]);

        renderPanel();

        expect(await screen.findByRole('option', {name: 'X Y (UNKNOWN_FIELD)'})).toBeInTheDocument();
        expect(groupLabels()).toEqual([roleHeader('STUDENT')]);
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

        expect(await screen.findByRole('alert')).toHaveTextContent(tr('dev.loadError'));
        expect(screen.getByRole('button', {name: tr('dev.retryBtn')})).toBeInTheDocument();
    });

    it('shouldReloadUsersWhenRetryIsClicked', async () => {
        getDevUsers
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce(USERS);
        renderPanel();
        fireEvent.click(await screen.findByRole('button', {name: tr('dev.retryBtn')}));

        expect(await screen.findByRole('option', {name: 'Alex Tremblay'})).toBeInTheDocument();

        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        expect(getDevUsers).toHaveBeenCalledTimes(2);
    });
});