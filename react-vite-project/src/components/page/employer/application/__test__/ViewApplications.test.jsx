import {render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import ViewApplications from '../ViewApplications.jsx';
import {getApplications, getEmployerInterviewsByApplicationId, getEmployerInternships} from '../../../../api/Api.jsx';


vi.mock('../../../api/Api.jsx', () => ({
    getApplications: vi.fn(),
    getEmployerInternships: vi.fn(),
    getApplicationCv: vi.fn(),
    getEmployerInterviewsByApplicationId: vi.fn(),
    createInterview: vi.fn(),
    updateInterview: vi.fn(),
    getApplicationCoverLetter: vi.fn(),
    getApplicationTranscript: vi.fn(),
}));

vi.mock('../../../../utils/usePolling.js', () => ({
    usePolling: vi.fn()
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({id: '10'}),
        useLocation: () => ({state: {}}),
        useOutletContext: () => ({dark: false}),
    };
});

// t returns the key, so assertions check translation keys, not any language
vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key) => key})
}));

const MockViewApplications = ({user}) => (<BrowserRouter>
    <ViewApplications user={user}/>
</BrowserRouter>);

describe('ViewApplications Component', () => {
    const loggedInUser = {isLoggedIn: true};

    beforeEach(() => {
        vi.clearAllMocks();
        getEmployerInterviewsByApplicationId.mockResolvedValue([]);
        window.history.pushState({}, '', '/application/10');
    });

    it('renders loading state initially', () => {
        getApplications.mockReturnValue(new Promise(() => {
        }));
        getEmployerInternships.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        expect(screen.getByText('viewApplication.loading')).toBeInTheDocument();
    });

    it('renders applications list, internship title and the translated back button', async () => {
        const mockInternships = [{id: 10, title: 'Software Engineering Intern', status: 'APPROVED'}];
        const mockApplications = [{
            id: 1,
            internshipId: 10,
            student: {firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com'},
            cvFileName: 'cv_alice.pdf',
            internshipApplicationStatus: 'READ'
        }];

        getEmployerInternships.mockResolvedValue(mockInternships);
        getApplications.mockResolvedValue(mockApplications);

        render(<MockViewApplications user={loggedInUser}/>);

        await waitFor(() => {
            expect(screen.getByText('Software Engineering Intern')).toBeInTheDocument();
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('cv_alice.pdf')).toBeInTheDocument();
        });
        expect(screen.getByText('viewApplication.backBtn')).toBeInTheDocument();
    });

    it('renders empty message when no applications are found', async () => {
        getEmployerInternships.mockResolvedValue([{id: 10, title: 'Internship X', status: 'APPROVED'}]);
        getApplications.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        await waitFor(() => {
            expect(screen.getByText('viewApplication.empty')).toBeInTheDocument();
        });
    });

    it('shows the translated error instead of crashing when applications fail to load', async () => {
        getEmployerInternships.mockResolvedValue([{id: 10, title: 'Internship X', status: 'APPROVED'}]);
        getApplications.mockRejectedValue(new Error('boom'));

        render(<MockViewApplications user={loggedInUser}/>);

        expect(await screen.findByRole('alert')).toHaveTextContent('viewApplication.loadError');
    });

    it('shows the translated error instead of loading forever when the internships fail to load', async () => {
        getEmployerInternships.mockRejectedValue(new Error('boom'));
        getApplications.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        expect(await screen.findByRole('alert')).toHaveTextContent('postInternship.loadError');
        expect(screen.queryByText('viewApplication.loading')).not.toBeInTheDocument();
    });

    it('redirects to internships when the internship does not belong to the employer', async () => {
        getEmployerInternships.mockResolvedValue([{id: 99, title: 'Someone else offer', status: 'APPROVED'}]);
        getApplications.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/internships');
        });
        expect(screen.queryByText('viewApplication.empty')).not.toBeInTheDocument();
    });

    it('redirects to internships when the internship is not approved yet', async () => {
        getEmployerInternships.mockResolvedValue([{id: 10, title: 'Pending offer', status: 'PENDING'}]);
        getApplications.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/internships');
        });
        expect(getApplications).not.toHaveBeenCalled();
    });
});