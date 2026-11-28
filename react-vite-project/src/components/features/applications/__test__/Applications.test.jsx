import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {BrowserRouter} from "react-router-dom";
import Applications from "../ApplicationList.jsx";
import {
    getApplicationCv,
    getApplications,
    getEmployerInterviewsByApplicationId,
    getEmployerInternships
} from "../../../shared/core/api/Api.jsx";
import {employerApplicationPath} from "../../../../routes/AppRoutes.jsx";

vi.mock('../../../shared/core/api/Api.jsx', () => ({
    getApplications: vi.fn(),
    getEmployerInternships: vi.fn(),
    getApplicationCv: vi.fn(),
    getApplicationCoverLetter: vi.fn(),
    getEmployerInterviewsByApplicationId: vi.fn(),
    createInterview: vi.fn(),
    updateInterview: vi.fn(),
}));

vi.mock('../../../../utils/hooks/usePolling.js', () => ({
    usePolling: vi.fn(),
}));

vi.mock('../../../../utils/session/useSession.js', () => ({
    useSession: () => ({selectedSession: {id: 1, name: 'H2027', target: true}}),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => ({dark: false}),
    };
});

vi.mock('react-i18next', async (importOriginal) => ({
    ...await importOriginal(),
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
    getEmployerInterviewsByApplicationId.mockResolvedValue([]);
    URL.revokeObjectURL = vi.fn();
});

describe('Applications page loading and errors', () => {
    it('shouldShowLoadingStateInitially', () => {

        getApplications.mockReturnValue(new Promise(() => {
        }));
        getEmployerInternships.mockResolvedValue([]);


        render(<MockApplications/>);


        expect(screen.getByText('applicationsPage.loading')).toBeInTheDocument();
    });

    it('shouldShowEmptyMessageWhenNoApplicationsExist', async () => {

        await renderLoaded([], INTERNSHIPS);


        expect(await screen.findByText('applicationsPage.empty')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('shouldShowErrorWhenApplicationsFailToLoad', async () => {

        getApplications.mockRejectedValue(new Error('boom'));
        getEmployerInternships.mockResolvedValue(INTERNSHIPS);


        render(<MockApplications/>);


        expect(await screen.findByRole('alert')).toHaveTextContent('applicationsPage.loadError');
    });

    it('shouldNotLoadAnythingWhenUserIsNotLoggedIn', () => {

        getApplications.mockResolvedValue([]);
        getEmployerInternships.mockResolvedValue([]);


        render(<MockApplications user={{}}/>);


        expect(getApplications).not.toHaveBeenCalled();
    });
});

describe('Applications page groups applications by internship', () => {
    it('shouldShowOneSectionPerInternshipWithItsTitle', async () => {

        await renderLoaded();


        expect(await screen.findByRole('heading', {level: 2, name: 'Software Engineering Intern'})).toBeInTheDocument();
        expect(screen.getByRole('heading', {level: 2, name: 'Data Intern'})).toBeInTheDocument();
    });

    it('shouldPutEachStudentUnderTheInternshipTheyAppliedTo', async () => {

        await renderLoaded();
        await screen.findByRole('heading', {level: 2, name: 'Data Intern'});


        const softwareSection = screen.getByRole('region', {name: 'Software Engineering Intern'});
        expect(within(softwareSection).getByText('Alice Smith')).toBeInTheDocument();
        expect(within(softwareSection).getByText('Carol White')).toBeInTheDocument();
        expect(within(softwareSection).queryByText('Bob Jones')).not.toBeInTheDocument();

        const dataSection = screen.getByRole('region', {name: 'Data Intern'});
        expect(within(dataSection).getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shouldListInternshipsWithUnreadApplicationsFirst', async () => {

        await renderLoaded();
        await screen.findByRole('heading', {level: 2, name: 'Data Intern'});


        const titles = screen.getAllByRole('heading', {level: 2}).map((h) => h.textContent);
        expect(titles).toEqual(['Data Intern', 'Software Engineering Intern']);
    });

    it('shouldShowUnknownInternshipWhenTitleCannotBeFound', async () => {

        const orphan = {...alice, id: 9, internshipId: 99};


        await renderLoaded([orphan], INTERNSHIPS);


        expect(await screen.findByRole('heading', {level: 2, name: 'applicationsPage.unknownInternship'}))
            .toBeInTheDocument();
    });

    it('shouldLinkEachSectionToItsInternshipApplicationsPage', async () => {

        await renderLoaded();
        const dataSection = await screen.findByRole('region', {name: 'Data Intern'});


        expect(within(dataSection).getByRole('link', {name: 'applicationsPage.openInternship'}))
            .toHaveAttribute('href', employerApplicationPath(20));
    });
});

describe('Applications page filters', () => {
    it('shouldListEveryInternshipWithItsCountInTheDropdown', async () => {

        await renderLoaded();


        expect(await screen.findByRole('option', {name: 'applicationsPage.allInternships'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Software Engineering Intern (2)'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Data Intern (1)'})).toBeInTheDocument();
    });

    it('shouldShowOnlyTheChosenInternshipWhenSelectedInTheDropdown', async () => {

        await renderLoaded();
        const select = await screen.findByLabelText('applicationsPage.internshipAria');


        fireEvent.change(select, {target: {value: '20'}});


        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', {level: 2, name: 'Software Engineering Intern'})).not.toBeInTheDocument();
    });

    it('shouldShowAllInternshipsAgainWhenAllIsSelected', async () => {

        await renderLoaded();
        const select = await screen.findByLabelText('applicationsPage.internshipAria');
        fireEvent.change(select, {target: {value: '20'}});


        fireEvent.change(select, {target: {value: 'ALL'}});


        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shouldSearchApplicationsByStudentName', async () => {

        await renderLoaded();
        await screen.findByText('Alice Smith');


        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'carol'}});


        expect(screen.getByText('Carol White')).toBeInTheDocument();
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });

    it('shouldHideSectionsWithoutMatchesWhenSearching', async () => {

        await renderLoaded();
        await screen.findByText('Alice Smith');


        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'bob@example.com'}});


        expect(screen.getByRole('heading', {level: 2, name: 'Data Intern'})).toBeInTheDocument();
        expect(screen.queryByRole('heading', {level: 2, name: 'Software Engineering Intern'})).not.toBeInTheDocument();
    });

    it('shouldShowNoMatchMessageWhenSearchHasNoResults', async () => {

        await renderLoaded();
        await screen.findByText('Alice Smith');


        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'zzz'}});


        expect(screen.getByText('applicationsPage.noMatch')).toBeInTheDocument();
    });

    it('shouldClearSearchWhenClearButtonIsClicked', async () => {

        await renderLoaded();
        await screen.findByText('Alice Smith');
        fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'zzz'}});


        fireEvent.click(screen.getByRole('button', {name: 'applicationsPage.clearSearchAria'}));


        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });
});

describe('Applications page CV preview', () => {
    it('shouldRemoveNewBadgeWhenCvPreviewIsOpened', async () => {

        getApplicationCv.mockResolvedValue({content: 'base64'});
        await renderLoaded([bob], INTERNSHIPS);
        const dataSection = await screen.findByRole('region', {name: 'Data Intern'});


        fireEvent.click(within(dataSection).getByRole('button', {name: 'cvDocuments.viewCVBtn'}));


        await waitFor(() => expect(within(dataSection).queryByText('viewApplication.new')).not.toBeInTheDocument());
        expect(getApplicationCv).toHaveBeenCalledWith(2);
    });

    it('shouldRemoveNewBadgeAndMarkAsReadWhenCoverLetterIsOpened', async () => {

        getApplicationCv.mockResolvedValue({content: 'base64'});
        await renderLoaded([{...bob, coverLetterId: 5}], INTERNSHIPS);
        const dataSection = await screen.findByRole('region', {name: 'Data Intern'});


        fireEvent.click(within(dataSection).getByRole('button', {name: 'applicationCard.coverLetter'}));


        await waitFor(() => expect(within(dataSection).queryByText('viewApplication.new')).not.toBeInTheDocument());
        expect(getApplicationCv).toHaveBeenCalledWith(2);
    });
});
