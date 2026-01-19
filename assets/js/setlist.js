/**
 * Setlist Module
 * Handles setlist management, drag-drop reordering
 */

let currentSetlist = [];
const setlistLabel = 'current_weekend';

async function loadSetlistFromSupabase()
{
    const supabaseClient = window.getSupabaseClient();
    if (!supabaseClient) return;
    try
    {
        const { data, error } = await supabaseClient.from('setlists').select('songs').eq('label', setlistLabel).single();
        if (error && error.code !== 'PGRST116') throw error;
        currentSetlist = (data && data.songs) ? data.songs : [];
    } catch (e) { console.error("Error loading setlist", e); }
    updateTableOneWithSetlist();
}

async function saveSetlistToSupabase()
{
    const supabaseClient = window.getSupabaseClient();
    if (!supabaseClient) return;
    try
    {
        const { error } = await supabaseClient.from('setlists').upsert({ label: setlistLabel, songs: currentSetlist }, { onConflict: 'label' });
        if (error) throw error;
        console.log('Setlist saved successfully.');
    } catch (error)
    {
        console.error('Error saving setlist:', error);
        alert('Failed to save setlist.');
    }
}

function updateTableOneWithSetlist()
{
    const tableOneBody = document.querySelector('#tableone tbody');
    if (!tableOneBody) return;
    tableOneBody.innerHTML = '';
    if (!Array.isArray(currentSetlist) || currentSetlist.length === 0)
    {
        tableOneBody.innerHTML = '<tr><td colspan="3" class="text-center">Setlist is empty. Log in to manage the setlist.</td></tr>';
        return;
    }
    currentSetlist.forEach(item =>
    {
        const { songName, displayName = 'Unknown Song', key = '?' } = item || {};
        if (!songName) return;
        const row = tableOneBody.insertRow();
        row.innerHTML = `
            <td>${displayName}</td>
            <td class="text-center selected-key">${key}</td>
            <td class="text-center"><a href="#" data-song-identifier="${songName}" data-content-type="chords" title="Chords"><i class="fa-solid fa-music"></i></a></td>
            <td class="text-center"><a href="#" data-song-identifier="${songName}" data-content-type="lyrics" title="Lyrics"><i class="fa-solid fa-align-left"></i></a></td>
        `;
    });
}

function renderSetlistUI()
{
    const currentSetlistItemsUl = document.getElementById('current-setlist-items');
    if (!currentSetlistItemsUl) return;
    currentSetlistItemsUl.innerHTML = '';
    if (!Array.isArray(currentSetlist) || currentSetlist.length === 0)
    {
        currentSetlistItemsUl.innerHTML = '<li>Setlist is empty.</li>';
        return;
    }
    currentSetlist.forEach((item, index) =>
    {
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', 'true');
        listItem.dataset.index = index;
        listItem.innerHTML = `
            <span class="drag-handle">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 5.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
                </svg>
            </span>
            <span class="song-name">${item.displayName} (${item.key})</span>
            <button class="remove-song-btn" data-index="${index}" aria-label="Remove ${item.displayName}">Remove</button>
        `;
        currentSetlistItemsUl.appendChild(listItem);
    });
}

async function addSongToSetlist(songFileIdentifier, displayName, key)
{
    const songSearchInput = document.getElementById('song-search-input');
    currentSetlist.push({ songName: songFileIdentifier, displayName: displayName, key: key });
    renderSetlistUI();
    await saveSetlistToSupabase();
    songSearchInput.value = '';
}

// Export functions
window.setlistModule = {
    loadSetlistFromSupabase,
    saveSetlistToSupabase,
    updateTableOneWithSetlist,
    renderSetlistUI,
    addSongToSetlist,
    getCurrentSetlist: () => currentSetlist,
    setCurrentSetlist: (newSetlist) => { currentSetlist = newSetlist; }
};
