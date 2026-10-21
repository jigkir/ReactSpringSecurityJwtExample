import {render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import ViewApplications from '../ViewApplications';
import {getApplications, getEmployerInternships} from '../../../api/Api.jsx';


vi.mock('../../../api/Api.jsx', () => ({
    getApplications: vi.fn(), getEmployerInternships: vi.fn(), getApplicationCv: vi.fn(),
}));

vi.mock('../../../utils/usePolling.js', () => ({
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
        window.history.pushState({}, '', '/application/10');
    });

    it('renders loading state initially', () => {
        getApplications.mockReturnValue(new Promise(() => {
        }));
        getEmployerInternships.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders applications list and internship title successfully', async () => {
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
    });

    it('renders empty message when no applications are found', async () => {
        getEmployerInternships.mockResolvedValue([{id: 10, title: 'Internship X', status: 'APPROVED'}]);
        getApplications.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        await waitFor(() => {
            expect(screen.getByText('No applications found for this internship.')).toBeInTheDocument();
        });
    });

    it('redirects to internships when the internship does not belong to the employer', async () => {
        getEmployerInternships.mockResolvedValue([{id: 99, title: 'Someone else offer', status: 'APPROVED'}]);
        getApplications.mockResolvedValue([]);

        render(<MockViewApplications user={loggedInUser}/>);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/internships');
        });
        expect(screen.queryByText('No applications found for this internship.')).not.toBeInTheDocument();
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