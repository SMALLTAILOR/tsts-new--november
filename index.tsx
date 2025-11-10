import React, { useState, useContext, createContext, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- DATA TYPES ---
type SalaryType = 'daily' | 'monthly' | 'piece_rate';
type UserStatus = 'active' | 'terminated';
type AttendanceStatus = 'pending' | 'approved' | 'rejected';
type Role = 'admin' | 'employee';

interface User {
  id: string;
  name: string;
  role: Role;
  jobProfile: string;
  salaryType: SalaryType;
  salaryAmount: number;
  status: UserStatus;
  imageUrl?: string;
}

interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  status: AttendanceStatus;
}

interface InventoryItem {
    id: string; // Tracking Number
    name: string;
    color: string;
    sizes: Record<string, number>; // e.g. { S: 10, M: 20, L: 5 }
}

// --- MOCK DATA ---
const initialUsers: User[] = [
  { id: 'admin', name: 'Admin', role: 'admin', jobProfile: 'Manager', salaryType: 'monthly', salaryAmount: 50000, status: 'active' },
  { id: 'emp-1', name: 'John Doe', role: 'employee', jobProfile: 'Cutter', salaryType: 'daily', salaryAmount: 1000, status: 'active', imageUrl: 'https://i.pravatar.cc/150?u=emp-1' },
  { id: 'emp-2', name: 'Jane Smith', role: 'employee', jobProfile: 'Sewer', salaryType: 'piece_rate', salaryAmount: 15, status: 'active', imageUrl: 'https://i.pravatar.cc/150?u=emp-2' },
  { id: 'emp-3', name: 'Peter Jones', role: 'employee', jobProfile: 'Sewer', salaryType: 'monthly', salaryAmount: 25000, status: 'terminated', imageUrl: 'https://i.pravatar.cc/150?u=emp-3' },
];

const initialAttendance: Attendance[] = [
    { id: 'att-1', userId: 'emp-1', date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString(), status: 'pending' }
];

const initialInventory: InventoryItem[] = [
    { id: 'TRK-001', name: 'T-Shirt', color: 'Blue', sizes: { 'S': 50, 'M': 100, 'L': 75 } },
    { id: 'TRK-002', name: 'Jeans', color: 'Black', sizes: { '30': 40, '32': 80, '34': 60 } },
];


// --- APP CONTEXT ---
const AppContext = createContext(null);

// Fix: Add type for children prop to resolve TypeScript error.
const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const value = {
    users, setUsers,
    attendance, setAttendance,
    inventory, setInventory,
    loggedInUser, setLoggedInUser
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- MAIN APP ---
const App = () => {
  const { loggedInUser, setLoggedInUser } = useContext(AppContext);

  if (!loggedInUser) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

// --- LOGIN SCREEN ---
const LoginScreen = () => {
    const { users, setLoggedInUser } = useContext(AppContext);
    const [selectedUserId, setSelectedUserId] = useState(users[0].id);

    const handleLogin = () => {
        const user = users.find(u => u.id === selectedUserId);
        if (user && user.status === 'active') {
            setLoggedInUser(user);
        } else {
            alert('This user is terminated or does not exist.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>The Small Tailor</h1>
                <p>Business Management Portal</p>
                <div className="form-group">
                    <label htmlFor="user-select">Select User to Login</label>
                    <select id="user-select" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                        ))}
                    </select>
                </div>
                <button onClick={handleLogin}>Login</button>
            </div>
        </div>
    );
};

// --- LAYOUT ---
const MainLayout = () => {
    const { loggedInUser, setLoggedInUser } = useContext(AppContext);
    const [page, setPage] = useState('dashboard');

    const PAGES = {
        dashboard: { title: "Dashboard", component: <Dashboard /> },
        employees: { title: "Employee Management", component: <EmployeeManagement /> },
        attendance: { title: "Attendance", component: <AttendanceManagement /> },
        inventory: { title: "Inventory", component: <InventoryManagement /> },
        wip: { title: "Work In Progress", component: <WIP /> }
    };

    const handleLogout = () => {
        setLoggedInUser(null);
    };

    return (
        <div className="app-layout">
            <Sidebar currentPage={page} setPage={setPage} />
            <main className="main-content">
                <header className="main-header">
                    <h1>{PAGES[page].title}</h1>
                    <div className="user-info">
                        <span>Welcome, {loggedInUser.name}</span>
                        <button onClick={handleLogout} className="btn-secondary">Logout</button>
                    </div>
                </header>
                <div className="page-content">
                    {PAGES[page].component}
                </div>
            </main>
        </div>
    );
};

const Sidebar = ({ currentPage, setPage }) => {
    const { loggedInUser } = useContext(AppContext);
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard' },
        ...(loggedInUser.role === 'admin' ? [{ id: 'employees', label: 'Employees' }] : []),
        { id: 'attendance', label: 'Attendance' },
        ...(loggedInUser.role === 'admin' ? [{ id: 'inventory', label: 'Inventory' }] : []),
        { id: 'wip', label: 'Work In Progress' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>The Small Tailor</h2>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    {navItems.map(item => (
                         <li key={item.id}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setPage(item.id); }} className={currentPage === item.id ? 'active' : ''}>
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

// --- PAGES ---
const Dashboard = () => {
    const { loggedInUser } = useContext(AppContext);
    return (
        <div className="card">
            <h3>Welcome to your Dashboard!</h3>
            <p>This is where you'll see a summary of your business activities. More widgets and stats coming soon!</p>
            {loggedInUser.role === 'employee' && (
                <p>You can mark your attendance and log your work using the sidebar navigation.</p>
            )}
        </div>
    );
};

const EmployeeManagement = () => {
    const { users } = useContext(AppContext);
    // Add/Edit functionality would be implemented here with forms and modals
    return (
        <div className="card">
            <div className="card-header">
                <h3>Employee List</h3>
                <button className="btn-primary">Add New Employee</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Job Profile</th>
                        <th>Salary Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.filter(u => u.role === 'employee').map(user => (
                        <tr key={user.id}>
                            <td>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    <img src={user.imageUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} style={{width: 40, height: 40, borderRadius: '50%', marginRight: 10}}/>
                                    {user.name}
                                </div>
                            </td>
                            <td>{user.jobProfile}</td>
                            <td>{user.salaryType}</td>
                            <td>
                                <span className={`tag ${user.status === 'active' ? 'tag-active' : 'tag-terminated'}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="actions">
                                <button className="btn-secondary">Edit</button>
                                <button className="btn-danger">
                                    {user.status === 'active' ? 'Terminate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AttendanceManagement = () => {
    const { loggedInUser, attendance, users, setAttendance } = useContext(AppContext);
    const today = new Date().toISOString().split('T')[0];

    const handleMarkPresent = () => {
        const alreadyMarked = attendance.some(a => a.userId === loggedInUser.id && a.date === today);
        if (alreadyMarked) {
            alert('You have already marked your attendance for today.');
            return;
        }
        const newRecord: Attendance = {
            id: `att-${Date.now()}`,
            userId: loggedInUser.id,
            date: today,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        setAttendance(prev => [...prev, newRecord]);
        alert('Attendance marked successfully! Awaiting admin approval.');
    };

    const handleApproval = (attId: string, newStatus: AttendanceStatus) => {
        setAttendance(prev => prev.map(att => att.id === attId ? {...att, status: newStatus} : att));
    };

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

    if (loggedInUser.role === 'employee') {
        const myAttendanceToday = attendance.find(a => a.userId === loggedInUser.id && a.date === today);
        return (
            <div className="card">
                <h3>Mark Today's Attendance</h3>
                <p>Date: {today}</p>
                {myAttendanceToday ? (
                     <p>Your attendance for today is marked. Status: <span className={`tag tag-${myAttendanceToday.status}`}>{myAttendanceToday.status}</span></p>
                ) : (
                    <button className="btn-primary" onClick={handleMarkPresent}>Mark Me Present</button>
                )}
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3>Employee Attendance Records</h3>
                {/* Date filter would go here */}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {attendance.map(att => (
                        <tr key={att.id}>
                            <td>{getUserName(att.userId)}</td>
                            <td>{att.date}</td>
                            <td>{new Date(att.timestamp).toLocaleTimeString()}</td>
                            <td><span className={`tag tag-${att.status}`}>{att.status}</span></td>
                            <td className="actions">
                                {att.status === 'pending' && (
                                    <>
                                        <button className="btn-success" onClick={() => handleApproval(att.id, 'approved')}>Approve</button>
                                        <button className="btn-danger" onClick={() => handleApproval(att.id, 'rejected')}>Reject</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const InventoryManagement = () => {
    const { inventory } = useContext(AppContext);

    return (
        <div className="card">
            <div className="card-header">
                <h3>Inventory Stock</h3>
                <button className="btn-primary">Add New Item</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Tracking #</th>
                        <th>Item Name</th>
                        <th>Color</th>
                        <th>Available Stock (Size-wise)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.color}</td>
                            <td>{Object.entries(item.sizes).map(([size, qty]) => `${size}: ${qty}`).join(', ')}</td>
                            <td className="actions">
                                <button className="btn-secondary">In/Out Entry</button>
                                <button className="btn-danger">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const WIP = () => {
    const { loggedInUser } = useContext(AppContext);
    
    if (loggedInUser.role === 'admin') {
        return (
            <div className="card">
                <h3>Work In Progress - Admin View</h3>
                <p>Here, you would define sewing operations and rates for each tracking number.</p>
                <p>This functionality is under construction.</p>
            </div>
        );
    }

    return (
         <div className="card">
            <h3>Daily Work Entry</h3>
            <p>Select the type of work you performed today and enter the details.</p>
            <p>This functionality is under construction.</p>
            {/* Employee work entry forms would go here */}
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
        <App />
    </AppProvider>
  </React.StrictMode>
);
