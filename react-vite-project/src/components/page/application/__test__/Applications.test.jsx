import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import Applications from '../Applications';
import {getApplicationCv, getApplications, getEmployerInternships} from '../../../api/Api.jsx';

vi.mock('../../../api/Api.jsx', () => ({
    getApplications: vi.fn(),
    getEmployerInternships: vi.fn(),
    getApplicationCv: vi.fn(),
}));

vi.mock('../../../../utils/usePolling.js', () => ({
    usePolling: vi.fn(),
}));

vi.mock('../../cv/cvUtils.js', () => ({
    base64ToBlobUrl: vi.fn(() => 'blob:cv'),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => ({dark: false}),
    };
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key) => key}),
}));

const MockApplications = ({user = {isLoggedIn: true}}) => (
    <BrowserRouter>
        <Applications user={user}/>
    </BrowserRouter>
);

const INTERNSHIPS = [
    {id: 10, title: 'Software Engineering Intern', status: 'APPROVED'},
    {id: 20, title: 'Data Intern', status: 'APPROVED'},
];

const alice = {
    id: 1,
    internshipId: 10,
    student: {firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com'},
    cvFileName: 'cv_alice.pdf',
    internshipApplicationStatus: 'READ',
};

const bob = {
    id: 2,
    internshipId: 20,
    student: {firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com'},
    cvFileName: 'cv_bob.pdf',
    internshipApplicationStatus: 'UNREAD',
};

const carol = {
    id: 3,
    internshipId: 10,
    student: {firstName: 'Carol', lastName: 'White', email: 'carol@example.com'},
    cvFileName: 'cv_carol.pdf',
    internshipApplicationStatus: 'READ',
};

const renderLoaded = async (applications = [alice, bob, carol], internships = INTERNSHIPS) => {
    getApplications.mockResolvedValue(applications);
    getEmployerInternships.mockResolvedValue(internships);
    render(<MockApplications/>);
    await waitFor(() => expect(getApplications).toHaveBeenCalled());
};

beforeEach(() => {
    vi.clearAllMocks();
    URL.revokeObjectURL = vi.fn();
});

describe('Applications page loading and errors', () => {
    it('shouldShowLoadingStateInitially', () => {
        // Arrange
        getApplications.mockReturnValue(new Promise(() => {}));
        getEmployerInternships.mockResolvedValue([]);

        // Act
        render(<MockApplications/>);

        // Assert
        expect(screen.getByText('applicationsPage.loading')).toBeInTheDocument();
    });

    it('shouldShowEmptyMessageWhenNoApplicationsExist', async () => {
        // Arrange + Act
        await renderLoaded([], INTERNSHIPS);

        // Assert
        expect(await screen.findByText('applicationsPage.empty')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('shouldShowErrorWhenApplicationsFailToLoad', async () => {
        // Arrange
        getApplications.mockRejectedValue(new Error('boom'));
        getEmployerInternships.mockResolvedValue(INTERNSHIPS);

        // Act
        render(<MockApplications/>);

        // Assert
        expect(await screen.findByRole('alert')).toHaveTextContent('applicationsPage.loadError');
    });

    it('shouldNotLoadAnythingWhenUserIsNotLoggedIn', () => {
        // Arrange
        getApplications.mockResolvedValue([]);
        getEmployerInternships.mockResolvedValue([]);

        // Act
        render(<MockApplications user={{}}/>);

        // Assert
        expect(getApplications).not.toHaveBeenCalled();
    });
});

describe('Applications page groups applications by internship', () => {
    it('shouldShowOneSectionPerInternshipWithItsTitle', async () => {
        // Arrange + Act
        await renderLoaded();

        // Assert
        expect(await screen.findByRole('heading', {level: 2, name: 'Software Engineering Intern'})).toBeInTheDocument();
        expect(screen.getByRole('heading', {level: 2, name: 'Data Intern'})).toBeInTheDocument();
    });

    it('shouldPutEachStudentUnderTheInternshipTheyAppliedTo', async () => {
        // Arrange + Act
        await renderLoaded();
        await screen.findByRole('heading', {level: 2, name: 'Data Intern'});

        // Assert
        const softwareSection = screen.getByRole('region', {name: 'Software Engineering Intern'});
        expect(within(softwareSection).getByText('Alice Smith')).toBeInTheDocument();
        expect(within(softwareSection).getByText('Carol White')).toBeInTheDocument();
        expect(within(softwareSection).queryByText('Bob Jones')).not.toBeInTheDocument();

        const dataSection = screen.getByRole('region', {name: 'Data Intern'});
        expect(within(dataSection).getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shouldListInternshipsWithUnreadApplicationsFirst', async () => {
        // Arrange + Act
        await renderLoaded();
        await screen.findByRole('heading', {level: 2, name: 'Data Intern'});

        // Assert
        const titles = screen.getAllByRole('heading', {level: 2}).map((h) => h.textContent);
        expect(titles).toEqual(['Data Intern', 'Software Engineering Intern']);
    });

    it('shouldShowUnknownInternshipWhenTitleCannotBeFound', async () => {
        // Arrange
        const orphan = {...alice, id: 9, internshipId: 99};

        // Act
        await renderLoaded([orphan], INTERNSHIPS);

        // Assert
        expect(await screen.findByRole('heading', {level: 2, name: 'applicationsPage.unknownInternship'}))
            .toBeInTheDocument();
    });

    it('shouldLinkEachSectionToItsInternshipApplicationsPage', async () => {
        // Arrange + Act
        await renderLoaded();
        const dataSection = await screen.findByRole('region', {name: 'Data Intern'});

        // Assert
        expect(within(dataSection).getByRole('link', {name: 'applicationsPage.openInternship'}))
            .toHaveAttribute('href', '/application/20');
    });

    it('shouldShowUnreadBadgeOnlyOnInternshipsWithUnreadApplications', async () => {
        // Arrange + Act
        await renderLoaded();
        const dataSection = await screen.findByRole('region', {name: 'Data Intern'});
        const softwareSection = screen.getByRole('region', {name: 'Software Engineering Intern'});

        // Assert
        expect(within(dataSection).getByText('applicationsPage.unreadCount')).toBeInTheDocument();
        expect(within(softwareSection).queryByText('applicationsPage.unreadCount')).not.toBeInTheDocument();
    });
});

describe('Applications page filters', () => {
    it('shouldListEveryInternshipWithItsCountInTheDropdown', async () => {
        // Arrange + Act
        await renderLoaded();

        // Assert
        expect(await screen.findByRole('option', {name: 'applicationsPage.allInternships'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Software Engineering Intern (2)'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Data Intern (1)'})).toBeInTheDocument();
    });

    it('shouldShowOnlyTheChosenInternshipWhenSelectedInTheDropdown', async () => {
        // Arrange
        await renderLoaded();
        const select = await screen.findByRole('combobox');

        // Act
        fireEvent.change(select, {target: {value: '20'}});

        // Assert
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', {level: 2, name: 'Software Engineering Intern'})).not.toBeInTheDocument();
    });

    it('shouldShowAllInternshipsAgainWhenAllIsSelected', async () => {
        // Arrange
        await renderLoaded();
        const select = await screen.findByRole('combobox');
        fireEvent.change(select, {target: {value: '20'}});

        // Act
        fireEvent.change(select, {target: {value: 'ALL'}});

        // Assert
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shouldSearchApplicationsByStudentName', async () => {
        // Arrange
        await renderLoaded();
        await screen.findByText('Alice Smith');

        // Act
        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'carol'}});

        // Assert
        expect(screen.getByText('Carol White')).toBeInTheDocument();
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });

    it('shouldHideSectionsWithoutMatchesWhenSearching', async () => {
        // Arrange
        await renderLoaded();
        await screen.findByText('Alice Smith');

        // Act
        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'bob@example.com'}});

        // Assert
        expect(screen.getByRole('heading', {level: 2, name: 'Data Intern'})).toBeInTheDocument();
        expect(screen.queryByRole('heading', {level: 2, name: 'Software Engineering Intern'})).not.toBeInTheDocument();
    });

    it('shouldShowNoMatchMessageWhenSearchHasNoResults', async () => {
        // Arrange
        await renderLoaded();
        await screen.findByText('Alice Smith');

        // Act
        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'zzz'}});

        // Assert
        expect(screen.getByText('applicationsPage.noMatch')).toBeInTheDocument();
    });

    it('shouldClearSearchWhenClearButtonIsClicked', async () => {
        // Arrange
        await renderLoaded();
        await screen.findByText('Alice Smith');
        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'zzz'}});

        // Act
        fireEvent.click(screen.getByRole('button', {name: 'applicationsPage.clearSearchAria'}));

        // Assert
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });
});

describe('Applications page CV preview', () => {
    it('shouldLoadCvAndMarkApplicationAsReadWhenPreviewIsOpened', async () => {
        // Arrange
        getApplicationCv.mockResolvedValue({content: 'base64'});
        await renderLoaded([bob], INTERNSHIPS);
        const dataSection = await screen.findByRole('region', {name: 'Data Intern'});
        expect(within(dataSection).getByText('viewApplication.new')).toBeInTheDocument();

        // Act
        fireEvent.click(within(dataSection).getByRole('button', {name: 'cvDocuments.viewBtn'}));

        // Assert
        await waitFor(() => expect(getApplicationCv).toHaveBeenCalledWith(2));
        await waitFor(() => {
            expect(screen.queryByText('viewApplication.new')).not.toBeInTheDocument();
        });
        expect(screen.queryByText('applicationsPage.unreadCount')).not.toBeInTheDocument();
    });
});