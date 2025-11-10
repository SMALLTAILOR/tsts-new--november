import React, { useState, useContext, createContext, useMemo, useEffect, useCallback } from 'react';
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

// --- INSTRUCTIONS FOR LIVE API ---
// To connect to your live Google Cloud backend, do the following:
// 1. **VERIFY YOUR URL:** Make sure your backend service is running and the URL is 100% correct.
// 2. **CHECK CORS:** Ensure your backend is configured to accept requests from this application's domain.
// 3. **UNCOMMENT THE `api` OBJECT:** Delete or comment out the `const api = mockApi;` line below.
// 4. **UNCOMMENT THE `realApi` OBJECT:** Uncomment the entire `const realApi = { ... };` block.

/*
const BASE_URL = 'https://tsts-new-november-725216105313.asia-south1.run.app/api';

const realApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },
  getAttendance: async (): Promise<Attendance[]> => {
    const response = await fetch(`${BASE_URL}/attendance`);
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return response.json();
  },
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await fetch(`${BASE_URL}/inventory`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },
  markAttendance: async (userId: string): Promise<Attendance> => {
    const response = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark attendance.');
    }
    return response.json();
  },
  updateAttendanceStatus: async (attId: string, status: AttendanceStatus): Promise<Attendance> => {
     const response = await fetch(`${BASE_URL}/attendance/${attId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status })
     });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status.');
     }
     return response.json();
  }
};
*/

// --- MOCK API (FOR DEMONSTRATION) ---
let mockUsers: User[] = [
    { id: 'user-1', name: 'Admin User', role: 'admin', jobProfile: 'Manager', salaryType: 'monthly', salaryAmount: 50000, status: 'active', imageUrl: 'https://i.pravatar.cc/150?u=admin' },
    { id: 'user-2', name: 'Sunita Sharma', role: 'employee', jobProfile: 'Cutter', salaryType: 'daily', salaryAmount: 800, status: 'active', imageUrl: 'https://i.pravatar.cc/150?u=sunita' },
    { id: 'user-3', name: 'Ramesh Kumar', role: 'employee', jobProfile: 'Stitcher', salaryType: 'piece_rate', salaryAmount: 15, status: 'active', imageUrl: 'https://i.pravatar.cc/150?u=ramesh' },
    { id: 'user-4', name: 'Geeta Devi', role: 'employee', jobProfile: 'Stitcher', salaryType: 'piece_rate', salaryAmount: 15, status: 'terminated', imageUrl: 'https://i.pravatar.cc/150?u=geeta' }
];

let mockAttendance: Attendance[] = [
    { id: 'att-1', userId: 'user-2', date: '2024-07-28', timestamp: '2024-07-28T09:05:12Z', status: 'approved' },
    { id: 'att-2', userId: 'user-3', date: '2024-07-28', timestamp: '2024-07-28T09:10:24Z', status: 'pending' }
];

let mockInventory: InventoryItem[] = [
    { id: 'TN-001', name: 'Men\'s Formal Shirt', color: 'White', sizes: { S: 10, M: 25, L: 15, XL: 5 } },
    { id: 'TN-002', name: 'Ladies Kurti', color: 'Blue', sizes: { M: 30, L: 20 } },
];

const mockApi = {
    getUsers: (): Promise<User[]> => new Promise(resolve => setTimeout(() => resolve(mockUsers), 500)),
    getAttendance: (): Promise<Attendance[]> => new Promise(resolve => setTimeout(() => resolve(mockAttendance), 500)),
    getInventory: (): Promise<InventoryItem[]> => new Promise(resolve => setTimeout(() => resolve(mockInventory), 500)),
    markAttendance: (userId: string): Promise<Attendance> => new Promise(resolve => {
        setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            const alreadyMarked = mockAttendance.some(a => a.userId === userId && a.date === today);
            if(alreadyMarked) {
                // In a real API this would be a proper rejection. Here we just don't add it.
                // For simplicity, we assume frontend logic prevents this.
            }
            const newRecord: Attendance = {
                id: `att-${Date.now()}`,
                userId,
                date: today,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            mockAttendance.push(newRecord);
            resolve(newRecord);
        }, 500);
    }),
    updateAttendanceStatus: (attId: string, status: AttendanceStatus): Promise<Attendance> => new Promise((resolve, reject) => {
        setTimeout(() => {
            const record = mockAttendance.find(a => a.id === attId);
            if (record) {
                record.status = status;
                resolve({ ...record });
            } else {
                reject(new Error('Record not found'));
            }
        }, 500);
    })
};

// --- SWITCH BETWEEN REAL AND MOCK API HERE ---
const api = mockApi; // Currently using MOCK API. To go live, change this to `const api = realApi;` and uncomment `realApi`.


// --- APP CONTEXT ---
interface AppContextValue {
  users: User[];
  attendance: Attendance[];
  inventory: InventoryItem[];
  loggedInUser: User | null;
  setLoggedInUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string | null;
  markAttendance: (user: User) => Promise<void>;
  updateAttendanceStatus: (attId: string, newStatus: AttendanceStatus) => Promise<void>;
  refetchInitialData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const refetchInitialData = useCallback(async () => {
    try {
        setLoading(true);
        setError(null);
        const [usersData, attendanceData, inventoryData] = await Promise.all([
            api.getUsers(),
            api.getAttendance(),
            api.getInventory()
        ]);
        setUsers(usersData);
        setAttendance(attendanceData);
        setInventory(inventoryData);
    } catch (err) {
        console.error("Failed to fetch initial data:", err);
        let errorMessage = "An unexpected error occurred. Please try again.";
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            errorMessage = "Could not connect to the Google Cloud service. This is often caused by a CORS policy issue on the backend or a network connectivity problem. Please check the browser's developer console for more details and ensure the service is configured to accept requests from this origin.";
        } else if (err instanceof Error) {
            errorMessage = `Failed to connect: ${err.message}`;
        }
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchInitialData();
  }, [refetchInitialData]);

  const markAttendance = async (user: User) => {
      try {
          const newRecord = await api.markAttendance(user.id);
          setAttendance(prev => [...prev, newRecord]);
          alert('Attendance marked successfully! Awaiting admin approval.');
      } catch (err) {
          alert((err as Error).message);
      }
  };
  
  const updateAttendanceStatus = async (attId: string, newStatus: AttendanceStatus) => {
      try {
        const updatedRecord = await api.updateAttendanceStatus(attId, newStatus);
        setAttendance(prev => prev.map(att => att.id === attId ? updatedRecord : att));
      } catch(err) {
        alert((err as Error).message);
      }
  };


  const value: AppContextValue = {
    users,
    attendance,
    inventory,
    loggedInUser, setLoggedInUser,
    loading,
    error,
    markAttendance,
    updateAttendanceStatus,
    refetchInitialData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- MAIN APP ---
const App = () => {
  const { loggedInUser, loading, error, refetchInitialData } = useAppContext();

  if (loading) {
    return <LoadingScreen message="Loading Application Data..." />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={refetchInitialData} />;
  }

  if (!loggedInUser) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

const LoadingScreen = ({ message }: { message: string }) => (
    <div className="loading-container">
        <div className="spinner"></div>
        <p>{message}</p>
    </div>
);

const ErrorScreen = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <div className="loading-container">
        <h3 style={{color: 'var(--danger-color)'}}>Connection Error</h3>
        <p style={{textAlign: 'center', maxWidth: '500px', padding: '0 20px'}}>{message}</p>
        <button onClick={onRetry} className="btn-primary" style={{marginTop: '20px'}}>Retry Connection</button>
    </div>
);


// --- LOGIN SCREEN ---
const LoginScreen = () => {
    const { users, setLoggedInUser } = useAppContext();
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        if(users.length > 0) {
            setSelectedUserId(users.find(u => u.status === 'active')?.id || '')
        }
    }, [users])

    const handleLogin = () => {
        const user = users.find(u => u.id === selectedUserId);
        if (user && user.status === 'active') {
            setLoggedInUser(user);
        } else {
            alert('This user is terminated or does not exist.');
        }
    };
    
    if (!users || users.length === 0) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>The Small Tailor</h1>
                    <p>No users could be loaded from the server.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>The Small Tailor</h1>
                <p>Business Management Portal</p>
                <div className="form-group">
                    <label htmlFor="user-select">Select User to Login</label>
                    <select id="user-select" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                        {users.filter(u => u.status === 'active').map(user => (
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
    const { loggedInUser, setLoggedInUser } = useAppContext();
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
                        <span>Welcome, {loggedInUser!.name}</span>
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

const Sidebar = ({ currentPage, setPage }: { currentPage: string, setPage: (page: string) => void }) => {
    const { loggedInUser } = useAppContext();
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard' },
        ...(loggedInUser!.role === 'admin' ? [{ id: 'employees', label: 'Employees' }] : []),
        { id: 'attendance', label: 'Attendance' },
        ...(loggedInUser!.role === 'admin' ? [{ id: 'inventory', label: 'Inventory' }] : []),
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
            <div className="sidebar-footer">
                <div className="storage-status">
                    <span className="status-indicator"></span>
                    Storage: {api === mockApi ? 'Offline Demo' : 'Google Cloud'}
                </div>
            </div>
        </aside>
    );
};

// --- PAGES ---
const Dashboard = () => {
    const { loggedInUser } = useAppContext();
    return (
        <div className="card">
            <h3>Welcome to your Dashboard!</h3>
             {api === mockApi && (
                <div style={{ padding: '15px', backgroundColor: 'var(--warning-color)', color: '#333', borderRadius: 'var(--border-radius)', marginTop: '20px', border: '1px solid #ffc107' }}>
                    <strong>Offline Demo Mode:</strong> This app is currently running with mock data. Your changes will not be saved permanently. To connect to your live backend, please follow the instructions in the `index.tsx` file.
                </div>
            )}
            <p style={{ marginTop: '20px' }}>This is where you'll see a summary of your business activities. More widgets and stats coming soon!</p>
            {loggedInUser!.role === 'employee' && (
                <p>You can mark your attendance and log your work using the sidebar navigation.</p>
            )}
        </div>
    );
};

const EmployeeManagement = () => {
    const { users } = useAppContext();
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
    const { loggedInUser, attendance, users, markAttendance, updateAttendanceStatus } = useAppContext();
    const today = new Date().toISOString().split('T')[0];

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

    if (loggedInUser!.role === 'employee') {
        const myAttendanceToday = attendance.find(a => a.userId === loggedInUser!.id && a.date === today);
        return (
            <div className="card">
                <h3>Mark Today's Attendance</h3>
                <p>Date: {today}</p>
                {myAttendanceToday ? (
                     <p>Your attendance for today is marked. Status: <span className={`tag tag-${myAttendanceToday.status}`}>{myAttendanceToday.status}</span></p>
                ) : (
                    <button className="btn-primary" onClick={() => markAttendance(loggedInUser!)}>Mark Me Present</button>
                )}
            </div>
        );
    }

    // Admin view
    const sortedAttendance = [...attendance].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
                    {sortedAttendance.map(att => (
                        <tr key={att.id}>
                            <td>{getUserName(att.userId)}</td>
                            <td>{att.date}</td>
                            <td>{new Date(att.timestamp).toLocaleTimeString()}</td>
                            <td><span className={`tag tag-${att.status}`}>{att.status}</span></td>
                            <td className="actions">
                                {att.status === 'pending' && (
                                    <>
                                        <button className="btn-success" onClick={() => updateAttendanceStatus(att.id, 'approved')}>Approve</button>
                                        <button className="btn-danger" onClick={() => updateAttendanceStatus(att.id, 'rejected')}>Reject</button>
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
    const { inventory } = useAppContext();

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
    const { loggedInUser } = useAppContext();
    
    if (loggedInUser!.role === 'admin') {
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

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppProvider>
        <App />
    </AppProvider>
  </React.StrictMode>
);