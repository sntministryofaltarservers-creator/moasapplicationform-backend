// =========================
// INDEX PAGE LOGIC
// =========================
const form = document.getElementById('applicationForm');
const previewBtn = document.getElementById('previewBtn');
const userImageInput = document.getElementById('userImage');

if (form && previewBtn) {
  previewBtn.disabled = true;
  previewBtn.style.opacity = '0.5';
  previewBtn.style.cursor = 'not-allowed';

  function checkFormCompletion() {
    let allFilled = true;

    form.querySelectorAll('[required]').forEach(input => {
      if (!input.value.trim()) {
        allFilled = false;
      }
    });

    if (!userImageInput.files || userImageInput.files.length === 0) {
      allFilled = false;
    }

    previewBtn.disabled = !allFilled;
    previewBtn.style.opacity = allFilled ? '1' : '0.5';
    previewBtn.style.cursor = allFilled ? 'pointer' : 'not-allowed';
  }

  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('input', checkFormCompletion);
  });

  userImageInput.addEventListener('change', checkFormCompletion);

  previewBtn.addEventListener('click', () => {
    const imageFile = userImageInput.files[0];
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    const formData = new FormData(form);
    formData.forEach((value, key) => {
      if (!(value instanceof File)) {
        sessionStorage.setItem(key, value);
      }
    });

    // Convert image to base64 and store in sessionStorage
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem('userImage_data', reader.result); // base64 string
      sessionStorage.setItem('userImage_name', imageFile.name);
      sessionStorage.setItem('userImage_type', imageFile.type);
      window.location.href = 'preview.html';
    };
    reader.readAsDataURL(imageFile);
  });
}

// =========================
// PREVIEW PAGE LOGIC
// =========================
if (window.location.pathname.endsWith('preview.html')) {
  document.getElementById('prevName').textContent = sessionStorage.getItem('fullName') || '';
  document.getElementById('prevAge').textContent = sessionStorage.getItem('age') || '';
  document.getElementById('prevAddress').textContent = sessionStorage.getItem('address') || '';
  document.getElementById('prevContact').textContent = sessionStorage.getItem('contact') || '';
  document.getElementById('prevFacebookName').textContent = sessionStorage.getItem('facebookName') || '';

  const imgData = sessionStorage.getItem('userImage_data');
  if (imgData) {
    const img = document.createElement('img');
    img.src = imgData;
    img.alt = "Uploaded Photo";
    img.className = "rounded-lg max-w-xs mx-auto";
    document.getElementById('prevImageContainer').appendChild(img);
  }

  document.getElementById('editBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  function hasSubmittedBefore(name) {
    const submitted = JSON.parse(localStorage.getItem('submittedNames') || '[]');
    return submitted.includes(name.trim().toLowerCase());
  }

  function markAsSubmitted(name) {
    const submitted = JSON.parse(localStorage.getItem('submittedNames') || '[]');
    submitted.push(name.trim().toLowerCase());
    localStorage.setItem('submittedNames', JSON.stringify(submitted));
  }

  const confirmBtn = document.getElementById("confirmBtn");
  const loadingScreen = document.getElementById("loading-screen");

  confirmBtn.addEventListener("click", () => {
    loadingScreen.style.display = "flex";

    const fullName = sessionStorage.getItem('fullName') || '';
    if (hasSubmittedBefore(fullName)) {
      alert('You have already submitted this form with the same name.');
      loadingScreen.style.display = "none";
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('age', sessionStorage.getItem('age') || '');
    formData.append('address', sessionStorage.getItem('address') || '');
    formData.append('contact', sessionStorage.getItem('contact') || '');
    formData.append('facebookName', sessionStorage.getItem('facebookName') || '');

    const imgData = sessionStorage.getItem('userImage_data');
    const imgName = sessionStorage.getItem('userImage_name');
    const imgType = sessionStorage.getItem('userImage_type');

    if (imgData && imgName && imgType) {
      const blob = dataURLtoBlob(imgData);
      formData.append('userImage', blob, imgName);
    }

    fetch('https://moasapplicationform-backend.onrender.com/send-email', {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(msg => { throw new Error(msg); });
        }
        markAsSubmitted(fullName);
        window.location.href = 'thankyou.html';
      })
      .catch(err => {
        alert(err.message || 'Error sending form');
        loadingScreen.style.display = "none";
      });
  });

  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

// =========================
// THANK YOU PAGE LOGIC
// =========================
if (window.location.pathname.endsWith('thankyou.html')) {
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 5000);
}
