/**
 * KaamSetu — AI Fix Assistant (Photo upload preview, Voice input, Checklist)
 */

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('aiImageInput');
  const dropzone = document.getElementById('aiDropzone');
  const previewBox = document.getElementById('aiImagePreview');
  const previewImg = document.getElementById('aiPreviewImg');
  const removeImgBtn = document.getElementById('aiRemoveImgBtn');
  const voiceBtn = document.getElementById('aiVoiceBtn');
  const textInput = document.getElementById('aiTextInput');

  // File Upload Preview & Drag-and-drop
  if (fileInput && dropzone) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        showPreview(fileInput.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        showPreview(fileInput.files[0]);
      }
    });

    function showPreview(file) {
      if (file && previewBox && previewImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewBox.style.display = 'block';
          dropzone.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    }

    if (removeImgBtn) {
      removeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        if (previewBox) previewBox.style.display = 'none';
        if (dropzone) dropzone.style.display = 'block';
      });
    }
  }

  // Speech Recognition (Voice Input)
  if (voiceBtn && textInput && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    let isRecording = false;

    voiceBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
      } else {
        try {
          recognition.start();
          isRecording = true;
          voiceBtn.classList.add('recording');
        } catch (err) {
          console.warn('Speech recognition error:', err);
        }
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      textInput.value = (textInput.value ? textInput.value + ' ' : '') + transcript;
    };

    recognition.onend = () => {
      isRecording = false;
      voiceBtn.classList.remove('recording');
    };
  }

  // Interactive DIY Checklist Toggle
  const checklistItems = document.querySelectorAll('.checklist-item');
  const checklistCountEl = document.getElementById('checklistDoneCount');
  const celebrationEl = document.getElementById('diySuccessBanner');

  checklistItems.forEach((item) => {
    item.addEventListener('click', () => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        item.classList.toggle('checked', checkbox.checked);
      }
      updateChecklistProgress();
    });
  });

  function updateChecklistProgress() {
    if (!checklistItems.length) return;
    const done = document.querySelectorAll('.checklist-item.checked').length;
    const total = checklistItems.length;
    if (checklistCountEl) checklistCountEl.innerText = `${done}/${total}`;
    if (celebrationEl) {
      celebrationEl.style.display = (done === total && total > 0) ? 'flex' : 'none';
    }
  }
});
