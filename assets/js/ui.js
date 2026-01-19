/**
 * UI Module
 * Handles modal interactions, keyboard navigation, and accessibility
 */

// Debounce search
let searchTimeout;
window.myFunction = function ()
{
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() =>
    {
        var input, filter, table, tr, td, i, txtValue;
        input = document.getElementById("myInput");
        filter = input.value.toUpperCase();
        table = document.getElementById("tabletwo");
        tr = table.getElementsByTagName("tr");
        for (i = 0; i < tr.length; i++)
        {
            td = tr[i].getElementsByTagName("td")[0];
            if (td)
            {
                txtValue = td.textContent || td.innerText;
                tr[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
            }
        }
    }, 300); // 300ms debounce delay
};

// Keyboard navigation - Close modals with Escape
function setupKeyboardNavigation()
{
    document.addEventListener('keydown', (e) =>
    {
        if (e.key === 'Escape')
        {
            const loginModal = document.getElementById('login-modal');
            const signupModal = document.getElementById('signup-modal');
            const setlistModal = document.getElementById('setlist-modal');
            const editSongModal = document.getElementById('edit-song-modal');
            const addSongModal = document.getElementById('add-song-modal');
            const userManagementModal = document.getElementById('user-management-modal');

            if (loginModal.style.display === 'block') loginModal.style.display = 'none';
            if (signupModal.style.display === 'block') signupModal.style.display = 'none';
            if (setlistModal.style.display === 'block') setlistModal.style.display = 'none';
            if (editSongModal.style.display === 'block') editSongModal.style.display = 'none';
            if (addSongModal.style.display === 'block') addSongModal.style.display = 'none';
            if (userManagementModal.style.display === 'block') userManagementModal.style.display = 'none';
        }
    });
}

// Handle delegated click for song links
function setupSongLinkHandlers()
{
    document.body.addEventListener('click', (event) =>
    {
        const songLink = event.target.closest('a[data-song-identifier]');
        const editLink = event.target.closest('a.edit-btn');
        const currentUserRole = window.authModule.getCurrentUserRole();

        if (editLink && (currentUserRole === 'Admin' || currentUserRole === 'User'))
        {
            event.preventDefault();
            window.songsModule.openEditModal(editLink.dataset.songIdentifier, editLink.dataset.displayName);
        }
        else if (songLink)
        {
            event.preventDefault();
            handleSongClick(event, songLink);
        }
    });
}

async function handleSongClick(event, linkElement)
{
    event.preventDefault();
    const songIdentifier = linkElement.dataset.songIdentifier;
    const contentType = linkElement.dataset.contentType;
    if (!songIdentifier || !contentType) return;

    const templateURL = "./assets/master/template.html";
    let targetURL = `${templateURL}?song=${encodeURIComponent(songIdentifier)}&contentType=${encodeURIComponent(contentType)}`;

    if (contentType === 'lyrics')
    {
        targetURL += `&hideTranspose=true`;
    }
    else if (contentType === 'chords')
    {
        // Check if this song is in the setlist and get the target key
        const currentSetlist = window.setlistModule ? window.setlistModule.getCurrentSetlist() : [];
        const setlistItem = currentSetlist.find(item => item.songName === songIdentifier);
        if (setlistItem && setlistItem.key)
        {
            targetURL += `&targetKey=${encodeURIComponent(setlistItem.key)}`;
        }
    }

    window.location.href = targetURL;
}

// User Management Modal functions
async function populateUserManagementModal()
{
    const supabaseClient = window.getSupabaseClient();
    const userListTableBody = document.querySelector('#user-list-table tbody');

    userListTableBody.innerHTML = '<tr><td colspan="3">Loading users...</td></tr>';
    try
    {
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('id, email, role, full_name');

        if (error) throw error;

        if (!profiles || profiles.length === 0)
        {
            userListTableBody.innerHTML = '<tr><td colspan="3">No users found</td></tr>';
            return;
        }

        userListTableBody.innerHTML = '';
        const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
        const currentUserRole = window.authModule ? window.authModule.getCurrentUserRole() : null;

        // Count occurrences of each name to identify duplicates
        const nameCounts = {};
        profiles.forEach(p =>
        {
            const name = p.full_name || p.email || 'N/A';
            nameCounts[name] = (nameCounts[name] || 0) + 1;
        });

        profiles.forEach(profile =>
        {
            const isCurrentUser = profile.id === currentUser?.id;
            const name = profile.full_name || profile.email || 'N/A';
            let displayName = name;

            // Always show the email in brackets when a full name and email are available
            if (profile.full_name && profile.email)
            {
                displayName = `${profile.full_name} <span class="user-email-hint">(${profile.email})</span>`;
            }
            else
            {
                displayName = profile.full_name || profile.email || 'N/A';
            }

            const row = userListTableBody.insertRow();
            row.innerHTML = `
                <td>${displayName}</td>
                <td>
                    <select class="role-select" data-user-id="${profile.id}" aria-label="Role for ${profile.full_name || profile.email}" ${isCurrentUser ? 'disabled' : ''}>
                        <option value="Unallocated" ${profile.role === 'Unallocated' ? 'selected' : ''}>Unallocated</option>
                        <option value="User" ${profile.role === 'User' ? 'selected' : ''}>User</option>
                        <option value="Admin" ${profile.role === 'Admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>
                    <button class="delete-user-btn" data-user-id="${profile.id}" aria-label="Delete user ${profile.full_name || profile.email}" ${isCurrentUser || currentUserRole !== 'Admin' ? 'disabled' : ''}>Delete</button>
                </td>
            `;
        });

    } catch (error)
    {
        userListTableBody.innerHTML = `<tr><td colspan="3">Error loading users: ${error.message}</td></tr>`;
        console.error("Error fetching user list:", error);
    }
}

function showUserManagementMessage(message, isError = false)
{
    const userManagementMsg = document.getElementById('user-management-msg');
    userManagementMsg.textContent = message;
    userManagementMsg.style.color = isError ? 'red' : 'green';
    setTimeout(() => { userManagementMsg.textContent = ''; }, 4000);
}

// Export functions
window.uiModule = {
    setupKeyboardNavigation,
    setupSongLinkHandlers,
    handleSongClick,
    populateUserManagementModal,
    showUserManagementMessage
};
