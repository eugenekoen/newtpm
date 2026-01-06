/**
 * Application Initialization
 * Sets up all event listeners and initializes the app
 */

document.addEventListener('DOMContentLoaded', () =>
{
    const supabaseClient = window.getSupabaseClient();
    if (!supabaseClient)
    {
        alert("Supabase configuration is missing. App cannot load data.");
        return;
    }

    // Initialize modules
    window.songsModule.populateSongDatabaseTable();
    window.setlistModule.loadSetlistFromSupabase();
    window.uiModule.setupKeyboardNavigation();
    window.uiModule.setupSongLinkHandlers();

    // DOM Elements
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const setlistModal = document.getElementById('setlist-modal');
    const editSongModal = document.getElementById('edit-song-modal');
    const addSongModal = document.getElementById('add-song-modal');
    const userManagementModal = document.getElementById('user-management-modal');

    const loginModalBtn = document.getElementById('login-modal-btn');
    const signupModalBtn = document.getElementById('signup-modal-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const signupBtn = document.getElementById('signup-btn');
    const signupNameInput = document.getElementById('signup-name');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupMsg = document.getElementById('signup-msg');

    const manageSetlistBtn = document.getElementById('manage-setlist-btn');
    const addSongBtnTrigger = document.getElementById('add-song-btn');
    const userManagementBtn = document.getElementById('user-management-btn');
    const userListTableBody = document.querySelector('#user-list-table tbody');

    const songSearchInput = document.getElementById('song-search-input');
    const keySelectDropdown = document.getElementById('key-select-dropdown');
    const addSongToSetlistBtn = document.getElementById('add-song-to-setlist-btn');
    const selectedSongIdentifierInput = document.getElementById('selected-song-identifier');
    const selectedSongDisplayNameInput = document.getElementById('selected-song-display-name');
    const songSearchResultsContainer = document.getElementById('song-search-results');
    const resultsListDiv = songSearchResultsContainer?.querySelector('.results-list');
    const currentSetlistItemsUl = document.getElementById('current-setlist-items');

    // --- AUTH LISTENERS ---
    loginModalBtn.addEventListener('click', () =>
    {
        loginErrorMsg.textContent = '';
        loginModal.style.display = 'block';
    });

    signupModalBtn.addEventListener('click', () =>
    {
        signupMsg.textContent = '';
        signupModal.style.display = 'block';
    });

    logoutBtn.addEventListener('click', async () =>
    {
        await window.authModule.signOut();
    });

    loginBtn.addEventListener('click', async () =>
    {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        const { data, error } = await window.authModule.signInWithEmail(email, password);
        if (error)
        {
            loginErrorMsg.textContent = error.message;
        } else
        {
            loginModal.style.display = 'none';
            loginPasswordInput.value = '';
        }
    });

    loginPasswordInput.addEventListener('keyup', e => e.key === 'Enter' && loginBtn.click());

    signupBtn.addEventListener('click', async () =>
    {
        signupMsg.textContent = '';
        signupMsg.classList.remove('success');

        const name = signupNameInput.value;
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;

        if (!name || !email || !password)
        {
            signupMsg.textContent = 'Please fill out all fields.';
            return;
        }

        const { data, error } = await window.authModule.signUpUser(name, email, password);

        if (error)
        {
            signupMsg.textContent = error.message;
        } else
        {
            await supabaseClient.auth.signOut();
            signupMsg.textContent = "Thank you for signing up! An administrator will review your account and allocate your role shortly.";
            signupMsg.classList.add('success');
            signupNameInput.value = '';
            signupEmailInput.value = '';
            signupPasswordInput.value = '';
            setTimeout(() =>
            {
                signupModal.style.display = 'none';
                signupMsg.textContent = '';
                signupMsg.classList.remove('success');
            }, 5000);
        }
    });

    signupPasswordInput.addEventListener('keyup', e => e.key === 'Enter' && signupBtn.click());

    // --- SONG LISTENERS ---
    addSongBtnTrigger.addEventListener('click', () =>
    {
        window.songsModule.openAddSongModal();
    });

    document.getElementById('save-new-song-btn').addEventListener('click', () =>
    {
        window.songsModule.saveNewSong();
    });

    document.getElementById('cancel-add-btn').addEventListener('click', () =>
    {
        addSongModal.style.display = 'none';
    });

    document.getElementById('save-song-btn').addEventListener('click', () =>
    {
        window.songsModule.saveSongChanges();
    });

    document.getElementById('delete-song-btn').addEventListener('click', () =>
    {
        window.songsModule.deleteSong();
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', () =>
    {
        editSongModal.style.display = 'none';
    });

    // --- SETLIST LISTENERS ---
    manageSetlistBtn.addEventListener('click', () =>
    {
        setlistModal.style.display = 'block';
        window.setlistModule.renderSetlistUI();
    });

    // Song search in setlist modal
    if (songSearchInput)
    {
        songSearchInput.addEventListener('input', () =>
        {
            const searchTerm = songSearchInput.value.trim().toLowerCase();
            resultsListDiv.innerHTML = '';
            selectedSongIdentifierInput.value = '';
            selectedSongDisplayNameInput.value = '';
            if (searchTerm.length < 1)
            {
                resultsListDiv.style.display = 'none';
                return;
            }
            const allSongs = window.songsModule.getAllSongsData();
            const matchedSongs = allSongs.filter(song => song.displayName.toLowerCase().includes(searchTerm));
            if (matchedSongs.length > 0)
            {
                matchedSongs.forEach(song =>
                {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'result-item';
                    itemDiv.textContent = song.displayName;
                    itemDiv.addEventListener('click', () =>
                    {
                        songSearchInput.value = song.displayName;
                        selectedSongIdentifierInput.value = song.identifier;
                        selectedSongDisplayNameInput.value = song.displayName;
                        resultsListDiv.style.display = 'none';
                    });
                    resultsListDiv.appendChild(itemDiv);
                });
                resultsListDiv.style.display = 'block';
            } else
            {
                resultsListDiv.style.display = 'none';
            }
        });
    }

    // Add song to setlist
    if (addSongToSetlistBtn)
    {
        addSongToSetlistBtn.addEventListener('click', async () =>
        {
            const songFileIdentifier = selectedSongIdentifierInput.value;
            const displayName = selectedSongDisplayNameInput.value;
            if (!songFileIdentifier || !displayName)
            {
                alert('Please search for a song and select it from the list.');
                return;
            }
            await window.setlistModule.addSongToSetlist(songFileIdentifier, displayName, keySelectDropdown.value);
        });
    }

    // Setlist item listeners
    if (currentSetlistItemsUl)
    {
        currentSetlistItemsUl.addEventListener('click', async (event) =>
        {
            if (event.target.classList.contains('remove-song-btn'))
            {
                const indexToRemove = parseInt(event.target.dataset.index, 10);
                let setlist = window.setlistModule.getCurrentSetlist();
                setlist.splice(indexToRemove, 1);
                window.setlistModule.setCurrentSetlist(setlist);
                window.setlistModule.renderSetlistUI();
                await window.setlistModule.saveSetlistToSupabase();
            }
        });

        // Drag and drop for setlist reordering
        const getDragAfterElement = (container, y) =>
        {
            const draggableElements = [...container.querySelectorAll('li[draggable="true"]:not(.dragging)')];
            return draggableElements.reduce((closest, child) =>
            {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset)
                {
                    return { offset: offset, element: child };
                } else
                {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        };

        currentSetlistItemsUl.addEventListener('dragstart', e =>
        {
            const listItem = e.target.closest('li[draggable="true"]');
            if (listItem)
            {
                setTimeout(() => { listItem.classList.add('dragging'); }, 0);
            }
        });

        currentSetlistItemsUl.addEventListener('dragover', e =>
        {
            e.preventDefault();
            const afterElement = getDragAfterElement(currentSetlistItemsUl, e.clientY);
            const draggingElement = currentSetlistItemsUl.querySelector('.dragging');
            if (draggingElement)
            {
                if (afterElement == null)
                {
                    currentSetlistItemsUl.appendChild(draggingElement);
                } else
                {
                    currentSetlistItemsUl.insertBefore(draggingElement, afterElement);
                }
            }
        });

        currentSetlistItemsUl.addEventListener('dragend', async (e) =>
        {
            const draggingElement = currentSetlistItemsUl.querySelector('.dragging');
            if (draggingElement)
            {
                draggingElement.classList.remove('dragging');
                const newOrderedIndices = Array.from(currentSetlistItemsUl.querySelectorAll('li')).map(li => parseInt(li.dataset.index));
                let currentSetlist = window.setlistModule.getCurrentSetlist();
                const newOrderedSetlist = newOrderedIndices.map(originalIndex => currentSetlist[originalIndex]);
                window.setlistModule.setCurrentSetlist(newOrderedSetlist);
                window.setlistModule.renderSetlistUI();
                await window.setlistModule.saveSetlistToSupabase();
            }
        });
    }

    // --- USER MANAGEMENT LISTENERS ---
    userManagementBtn.addEventListener('click', () =>
    {
        userManagementModal.style.display = 'block';
        window.uiModule.populateUserManagementModal();
    });

    userListTableBody.addEventListener('change', async (event) =>
    {
        if (event.target.classList.contains('role-select'))
        {
            const userId = event.target.dataset.userId;
            const newRole = event.target.value;
            const { error } = await supabaseClient
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error)
            {
                window.uiModule.showUserManagementMessage(`Error updating role: ${error.message}`, true);
            } else
            {
                window.uiModule.showUserManagementMessage(`Successfully updated role.`);
            }
        }
    });

    // --- MODAL CLOSE LISTENERS ---
    document.querySelector('.close-login-modal-btn').addEventListener('click', () => loginModal.style.display = 'none');
    document.querySelector('.close-signup-modal-btn').addEventListener('click', () => signupModal.style.display = 'none');
    document.querySelector('.close-edit-modal-btn').addEventListener('click', () => editSongModal.style.display = 'none');
    document.querySelector('.close-add-modal-btn').addEventListener('click', () => addSongModal.style.display = 'none');
    document.querySelector('.close-user-management-modal-btn').addEventListener('click', () => userManagementModal.style.display = 'none');

    const closeSetlistModalBtn = setlistModal?.querySelector('.close-modal-btn');
    if (closeSetlistModalBtn)
    {
        closeSetlistModalBtn.addEventListener('click', () =>
        {
            setlistModal.style.display = 'none';
            window.setlistModule.updateTableOneWithSetlist();
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (event) =>
    {
        if (event.target == loginModal) loginModal.style.display = 'none';
        if (event.target == signupModal) signupModal.style.display = 'none';
        if (event.target == setlistModal)
        {
            setlistModal.style.display = 'none';
            window.setlistModule.updateTableOneWithSetlist();
        }
        if (event.target == userManagementModal) userManagementModal.style.display = 'none';
    });

    // --- AUTH STATE CHANGE ---
    supabaseClient.auth.onAuthStateChange((event, session) =>
    {
        window.authModule.updateAuthState(session?.user);
    });
});
