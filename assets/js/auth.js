/**
 * Authentication Module
 * Handles user authentication (login, signup, logout)
 */

let currentUserRole = null;

async function fetchUserRole(userId)
{
    const supabaseClient = window.getSupabaseClient();
    if (!userId) return 'User';
    try
    {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data ? data.role : 'User';
    } catch (error)
    {
        console.error("Error fetching user role:", error);
        return 'User';
    }
}

async function signInWithEmail(email, password)
{
    const supabaseClient = window.getSupabaseClient();
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    return { data, error };
}

async function signOut()
{
    const supabaseClient = window.getSupabaseClient();
    const { error } = await supabaseClient.auth.signOut();
    return { error };
}

async function signUpUser(name, email, password)
{
    const supabaseClient = window.getSupabaseClient();
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: name
            }
        }
    });
    return { data, error };
}

async function updateAuthState(user)
{
    const loginModalBtn = document.getElementById('login-modal-btn');
    const signupModalBtn = document.getElementById('signup-modal-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const manageSetlistBtn = document.getElementById('manage-setlist-btn');
    const addSongBtnTrigger = document.getElementById('add-song-btn');
    const userManagementBtn = document.getElementById('user-management-btn');

    document.body.classList.toggle('logged-in', !!user);

    if (user)
    {
        loginModalBtn.style.display = 'none';
        signupModalBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';

        currentUserRole = await fetchUserRole(user.id);

        if (currentUserRole === 'User' || currentUserRole === 'Admin')
        {
            manageSetlistBtn.style.display = 'inline-block';
            addSongBtnTrigger.style.display = 'inline-block';
        }

        if (currentUserRole === 'Admin')
        {
            userManagementBtn.style.display = 'inline-block';
        } else
        {
            userManagementBtn.style.display = 'none';
        }
    } else
    {
        loginModalBtn.style.display = 'inline-block';
        signupModalBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        currentUserRole = null;
        manageSetlistBtn.style.display = 'none';
        addSongBtnTrigger.style.display = 'none';
        userManagementBtn.style.display = 'none';
    }
}

// Export functions
window.authModule = {
    fetchUserRole,
    signInWithEmail,
    signOut,
    signUpUser,
    updateAuthState,
    getCurrentUserRole: () => currentUserRole
};
