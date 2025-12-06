document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const textOutput = document.getElementById('textOutput');
    const status = document.getElementById('status');
    const wordCount = document.getElementById('wordCount');
    const notesList = document.getElementById('notesList');
    
    let recognition = null;
    let isListening = false;
    let savedNotes = [];
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            status.innerHTML = '<i class="fas fa-microphone"></i> Listening... Speak now!';
            status.className = 'status listening';
        };
        
        recognition.onresult = function(event) {
            let transcript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                } else {
                    transcript += event.results[i][0].transcript;
                }
            }
            
            textOutput.value = transcript;
            updateWordCount();
        };
        
        recognition.onerror = function(event) {
            console.log('Speech recognition error:', event.error);
            
            if (event.error === 'no-speech') {
                status.innerHTML = '<i class="fas fa-exclamation-circle"></i> No speech detected. Try again.';
                status.className = 'status idle';
            } else if (event.error === 'audio-capture') {
                status.innerHTML = '<i class="fas fa-exclamation-circle"></i> No microphone found.';
                status.className = 'status idle';
            } else if (event.error === 'not-allowed') {
                status.innerHTML = '<i class="fas fa-exclamation-circle"></i> Microphone access was denied.';
                status.className = 'status idle';
            }
            
            resetListeningState();
        };
        
        recognition.onend = function() {
            if (isListening) {
                recognition.start();
            } else {
                resetListeningState();
            }
        };
    } else {
        startBtn.disabled = true;
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Speech recognition not supported in this browser.';
        status.className = 'status idle';
        alert('Sorry, your browser does not support speech recognition. Try Chrome or Edge.');
    }
    
    startBtn.addEventListener('click', function() {
        if (recognition && !isListening) {
            recognition.start();
        }
    });
    
    stopBtn.addEventListener('click', function() {
        if (recognition && isListening) {
            isListening = false;
            recognition.stop();
        }
    });
    
    saveBtn.addEventListener('click', function() {
        const text = textOutput.value.trim();
        
        if (text === '') {
            alert('Cannot save an empty note. Please speak something first.');
            return;
        }
        
        const newNote = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            text: text
        };
        
        savedNotes.unshift(newNote);
        saveNotesToStorage();
        displayNotes();
        
        const saveMessage = document.createElement('div');
        saveMessage.innerHTML = '<i class="fas fa-check-circle"></i> Note saved successfully!';
        saveMessage.style.cssText = 'background-color:#d1f7c4;color:#2e7d32;padding:10px;border-radius:5px;margin-top:10px;text-align:center;';
        
        saveBtn.parentNode.appendChild(saveMessage);
        
        setTimeout(() => {
            saveMessage.remove();
        }, 2000);
    });
    
    clearBtn.addEventListener('click', function() {
        if (textOutput.value.trim() !== '' || savedNotes.length > 0) {
            if (confirm('Are you sure you want to clear all text and notes?')) {
                textOutput.value = '';
                updateWordCount();
                savedNotes = [];
                saveNotesToStorage();
                displayNotes();
                
                if (isListening) {
                    recognition.stop();
                }
            }
        } else {
            alert('There is nothing to clear.');
        }
    });
    
    textOutput.addEventListener('input', updateWordCount);
    
    function updateWordCount() {
        const text = textOutput.value.trim();
        const words = text === '' ? 0 : text.split(/\s+/).length;
        wordCount.textContent = words;
    }
    
    function resetListeningState() {
        isListening = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        status.innerHTML = '<i class="fas fa-microphone-slash"></i> Ready to listen';
        status.className = 'status idle';
    }
    
    function saveNotesToStorage() {
        localStorage.setItem('speechNotes', JSON.stringify(savedNotes));
    }
    
    function loadNotesFromStorage() {
        const storedNotes = localStorage.getItem('speechNotes');
        if (storedNotes) {
            savedNotes = JSON.parse(storedNotes);
        }
    }
    
    function displayNotes() {
        if (savedNotes.length === 0) {
            notesList.innerHTML = '<p class="empty-notes">No saved notes yet. Speak something and click "Save Note"!</p>';
            return;
        }
        
        notesList.innerHTML = '';
        
        savedNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-date">
                    <i class="far fa-calendar-alt"></i> ${note.date}
                </div>
                <div class="note-text">${note.text}</div>
                <button class="delete-note" data-id="${note.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            notesList.appendChild(noteElement);
        });
        
        document.querySelectorAll('.delete-note').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteNote(id);
            });
        });
    }
    
    function deleteNote(id) {
        if (confirm('Delete this note?')) {
            savedNotes = savedNotes.filter(note => note.id !== id);
            saveNotesToStorage();
            displayNotes();
        }
    }
    
    loadNotesFromStorage();
    displayNotes();
    updateWordCount();
});