
'use client';

// This is a wrapper page for the UserManagement component.
// The actual logic is in the layout and the component itself.
import UserManagement from '@/components/admin/user-management';

export default function AdminUsersPage() {
    // The layout determines if this should be shown based on role.
    // So if we are here, the user is an Admin.
    return <UserManagement />;
}

