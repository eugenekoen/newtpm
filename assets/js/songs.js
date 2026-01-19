/**
 * Songs Module
 * Handles song CRUD operations and song database management
 */

let allSongsData = [];

async function populateSongDatabaseTable()
{
    const supabaseClient = window.getSupabaseClient();
    const tableTwoBody = document.querySelector('#tabletwo tbody');

    if (!supabaseClient || !tableTwoBody) return;
    tableTwoBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading song database...</td></tr>';
    try
    {
        const { data, error } = await supabaseClient.from('songs').select('song_identifier, display_name').order('display_name', { ascending: true });
        if (error) throw error;
        allSongsData = data.map(song => ({ identifier: song.song_identifier, displayName: song.display_name }));
        tableTwoBody.innerHTML = '';
        if (allSongsData.length === 0)
        {
            tableTwoBody.innerHTML = '<tr><td colspan="4" class="text-center">No songs found in the database.</td></tr>';
            return;
        }
        allSongsData.forEach(song =>
        {
            const row = tableTwoBody.insertRow();
            row.innerHTML = `
                <td>${song.displayName}</td>
                <td class="edit-col text-center">
                    <a href="#" class="edit-btn" data-song-identifier="${song.identifier}" data-display-name="${song.displayName}">Edit</a>
                </td>
                <td class="text-center">
                    <a href="#" data-song-identifier="${song.identifier}" data-content-type="chords" title="Chords"><i class="fa-solid fa-music"></i></a>
                </td>
                <td class="text-center">
                    <a href="#" data-song-identifier="${song.identifier}" data-content-type="lyrics" title="Lyrics"><i class="fa-solid fa-align-left"></i></a>
                </td>
            `;
        });
    } catch (error)
    {
        console.error('Error loading song database:', error);
        tableTwoBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading song database.</td></tr>';
    }
}

async function openEditModal(songIdentifier, displayName)
{
    const supabaseClient = window.getSupabaseClient();
    const editSongModal = document.getElementById('edit-song-modal');
    const editSongMsg = document.getElementById('edit-song-msg');
    const editSongTitle = document.getElementById('edit-song-title');
    const editSongTextarea = document.getElementById('edit-song-textarea');
    const editSongLyricsTextarea = document.getElementById('edit-song-lyrics-textarea');
    const saveSongBtn = document.getElementById('save-song-btn');
    const deleteSongBtn = document.getElementById('delete-song-btn');

    editSongMsg.textContent = '';
    editSongTitle.textContent = `Edit Song: ${displayName}`;
    editSongTextarea.value = 'Loading...';
    editSongLyricsTextarea.value = 'Loading...';
    editSongModal.style.display = 'block';
    saveSongBtn.dataset.songIdentifier = songIdentifier;

    // Reset delete button state and visibility based on role
    if (deleteSongBtn)
    {
        const currentUserRole = window.authModule ? window.authModule.getCurrentUserRole() : null;
        if (currentUserRole === 'Admin')
        {
            deleteSongBtn.style.display = 'inline-block';
            deleteSongBtn.disabled = false;
            deleteSongBtn.textContent = 'Delete Song';
        } else
        {
            deleteSongBtn.style.display = 'none';
        }
    }

    try
    {
        const { data, error } = await supabaseClient.from('songs').select('chords_content, lyrics_content').eq('song_identifier', songIdentifier).single();
        if (error) throw error;
        editSongTextarea.value = data.chords_content || '';
        editSongLyricsTextarea.value = data.lyrics_content || '';
    } catch (error)
    {
        editSongTextarea.value = 'Error loading song content.';
        editSongLyricsTextarea.value = 'Error loading lyrics content.';
        console.error('Error fetching song for edit:', error);
    }
}

async function saveSongChanges()
{
    const supabaseClient = window.getSupabaseClient();
    const saveSongBtn = document.getElementById('save-song-btn');
    const editSongModal = document.getElementById('edit-song-modal');
    const editSongMsg = document.getElementById('edit-song-msg');
    const editSongTextarea = document.getElementById('edit-song-textarea');
    const editSongLyricsTextarea = document.getElementById('edit-song-lyrics-textarea');

    const songIdentifier = saveSongBtn.dataset.songIdentifier;
    const newChordsContent = editSongTextarea.value;
    const newLyricsContent = editSongLyricsTextarea.value;
    if (!songIdentifier) { alert('Error: No song identifier found.'); return; }
    saveSongBtn.disabled = true;
    saveSongBtn.textContent = 'Saving...';
    try
    {
        const { error } = await supabaseClient.from('songs').update({
            chords_content: newChordsContent,
            lyrics_content: newLyricsContent
        }).eq('song_identifier', songIdentifier);
        if (error) throw error;
        editSongMsg.textContent = 'Saved successfully!';
        editSongMsg.style.color = 'green';
        setTimeout(() => { editSongModal.style.display = 'none'; }, 1500);
    } catch (error)
    {
        editSongMsg.style.color = 'red';
        editSongMsg.textContent = `Error: ${error.message}`;
    } finally
    {
        saveSongBtn.disabled = false;
        saveSongBtn.textContent = 'Save Changes';
    }
}

async function deleteSong()
{
    const supabaseClient = window.getSupabaseClient();
    const saveSongBtn = document.getElementById('save-song-btn');
    const deleteSongBtn = document.getElementById('delete-song-btn');
    const editSongTitle = document.getElementById('edit-song-title');
    const editSongModal = document.getElementById('edit-song-modal');
    const editSongMsg = document.getElementById('edit-song-msg');

    // Security check
    const currentUserRole = window.authModule ? window.authModule.getCurrentUserRole() : null;
    if (currentUserRole !== 'Admin')
    {
        alert('You do not have permission to delete songs.');
        return;
    }

    const songIdentifier = saveSongBtn.dataset.songIdentifier;
    if (!songIdentifier) { alert('Error: No song identifier found.'); return; }

    const displayName = editSongTitle.textContent.replace('Edit Song: ', '');
    if (!confirm(`Are you sure you want to permanently delete "${displayName}"? This action cannot be undone.`))
    {
        return;
    }

    deleteSongBtn.disabled = true;
    deleteSongBtn.textContent = 'Deleting...';

    try
    {
        // Use .select() to ensure we get confirmation that a row was actually deleted
        const { data, error } = await supabaseClient.from('songs').delete().eq('song_identifier', songIdentifier).select();
        if (error) throw error;

        if (!data || data.length === 0)
        {
            throw new Error("Could not delete song. You may not have permission.");
        }

        editSongMsg.textContent = 'Song deleted successfully!';
        editSongMsg.style.color = 'green';
        setTimeout(() =>
        {
            editSongModal.style.display = 'none';
            populateSongDatabaseTable();
        }, 1000);
    } catch (error)
    {
        editSongMsg.style.color = 'red';
        editSongMsg.textContent = `Error deleting song: ${error.message}`;
        deleteSongBtn.disabled = false;
        deleteSongBtn.textContent = 'Delete Song';
    }
}

async function openAddSongModal()
{
    const addSongModal = document.getElementById('add-song-modal');
    const addSongErrorMsg = document.getElementById('add-song-error-msg');
    const newSongDisplayNameInput = document.getElementById('new-song-display-name');
    const newSongIdentifierInput = document.getElementById('new-song-identifier');
    const newSongChordsTextarea = document.getElementById('new-song-chords');
    const newSongLyricsTextarea = document.getElementById('new-song-lyrics');
    const SONG_TEMPLATE = `[KEY]
SONG NAME
=========
================================================
PASTE SONG HERE (with 2 spacings on left)
================================================`;

    addSongErrorMsg.textContent = '';
    newSongDisplayNameInput.value = '';
    newSongIdentifierInput.value = '';
    newSongChordsTextarea.value = SONG_TEMPLATE;
    newSongLyricsTextarea.value = '';
    addSongModal.style.display = 'block';
    newSongDisplayNameInput.focus();
}

async function saveNewSong()
{
    const supabaseClient = window.getSupabaseClient();
    const newSongDisplayNameInput = document.getElementById('new-song-display-name');
    const newSongIdentifierInput = document.getElementById('new-song-identifier');
    const newSongChordsTextarea = document.getElementById('new-song-chords');
    const newSongLyricsTextarea = document.getElementById('new-song-lyrics');
    const addSongErrorMsg = document.getElementById('add-song-error-msg');
    const saveNewSongBtn = document.getElementById('save-new-song-btn');
    const addSongModal = document.getElementById('add-song-modal');

    const displayName = newSongDisplayNameInput.value.trim();
    const identifier = newSongIdentifierInput.value.trim().toLowerCase();
    const chordsContent = newSongChordsTextarea.value;
    const lyricsContent = newSongLyricsTextarea.value;

    if (!displayName || !identifier)
    {
        addSongErrorMsg.textContent = 'Song Title and Identifier are required.';
        return;
    }
    if (!/^[a-z0-9-]+$/.test(identifier))
    {
        addSongErrorMsg.textContent = 'Identifier can only contain lowercase letters, numbers, and hyphens.';
        return;
    }
    saveNewSongBtn.disabled = true;
    saveNewSongBtn.textContent = 'Saving...';
    addSongErrorMsg.textContent = '';
    try
    {
        const { error } = await supabaseClient.from('songs').insert([{
            song_identifier: identifier,
            display_name: displayName,
            chords_content: chordsContent,
            lyrics_content: lyricsContent
        }]);
        if (error)
        {
            if (error.code === '23505') { throw new Error(`Identifier '${identifier}' is already taken.`); }
            throw error;
        }
        addSongModal.style.display = 'none';
        await populateSongDatabaseTable();
    } catch (error)
    {
        addSongErrorMsg.textContent = `Error: ${error.message}`;
    } finally
    {
        saveNewSongBtn.disabled = false;
        saveNewSongBtn.textContent = 'Save New Song';
    }
}

// Export functions
window.songsModule = {
    populateSongDatabaseTable,
    openEditModal,
    saveSongChanges,
    deleteSong,
    openAddSongModal,
    saveNewSong,
    getAllSongsData: () => allSongsData
};
