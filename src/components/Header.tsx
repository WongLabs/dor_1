import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, Music2, ListMusic, Library, User, Users } from 'lucide-react'; // Added Users icon

interface NavItem {
  path: string;
  name: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { path: '/', name: 'Home', icon: HomeIcon },
  { path: '/artists', name: 'Artists', icon: Users }, // Added Artists link
  { path: '/moods', name: 'Moods', icon: Music2 },
  { path: '/genres', name: 'Genres', icon: Library },
  { path: '/music', name: 'Music', icon: ListMusic }, // Assuming /music maps to FilteredMood.tsx
  { path: '/my-list', name: 'My list', icon: User }, // Assuming /my-list maps to DownloadLists.tsx
];

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/">YourLogo</Link> {/* Replace YourLogo with your actual logo or app name */}
        </div>
        <ul className="flex space-x-6 items-center">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    location.pathname === item.path
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header; 