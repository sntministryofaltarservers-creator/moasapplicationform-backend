const form = document.getElementById('applicationForm');
const previewBtn = document.getElementById('previewBtn');

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
    previewBtn.disabled = !allFilled;
    previewBtn.style.opacity = allFilled ? '1' : '0.5';
    previewBtn.style.cursor = allFilled ? 'pointer' : 'not-allowed';
  }

  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('input', checkFormCompletion);
  });

  previewBtn.addEventListener('click', () => {
    const formData = new FormData(form);
    const promises = [];

    formData.forEach((value, key) => {
      if (value instanceof File && value.size > 0) {
        const promise = new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = e => {
            sessionStorage.setItem(key, e.target.result);
            sessionStorage.setItem(key + '_name', value.name);
            resolve();
          };
          reader.readAsDataURL(value);
        });
        promises.push(promise);
      } else {
        sessionStorage.setItem(key, value);
      }
    });

    Promise.all(promises).then(() => {
      window.location.href = 'preview.html';
    });
  });
}

if (window.location.pathname.endsWith('preview.html')) {
  document.getElementById('prevName').textContent = sessionStorage.getItem('fullName') || '';
  document.getElementById('prevAge').textContent = sessionStorage.getItem('age') || '';
  document.getElementById('prevAddress').textContent = sessionStorage.getItem('address') || '';
  document.getElementById('prevContact').textContent = sessionStorage.getItem('contact') || '';
  document.getElementById('prevFacebookName').textContent = sessionStorage.getItem('facebookName') || '';

  const imgData = sessionStorage.getItem('userImage');
  if (imgData) {
    const img = document.createElement('img');
    img.src = imgData;
    img.style.maxWidth = '300px';
    img.style.borderRadius = '8px';
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

  document.getElementById('confirmBtn').addEventListener('click', () => {
    const fullName = sessionStorage.getItem('fullName') || '';
    if (hasSubmittedBefore(fullName)) {
      alert('You have already submitted this form with the same name.');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('age', sessionStorage.getItem('age') || '');
    formData.append('address', sessionStorage.getItem('address') || '');
    formData.append('contact', sessionStorage.getItem('contact') || '');
    formData.append('facebookName', sessionStorage.getItem('facebookName') || '');

    const imgData = sessionStorage.getItem('userImage');
    const imgName = sessionStorage.getItem('userImage_name');
    if (imgData && imgName) {
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

if (window.location.pathname.endsWith('thankyou.html')) {
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.getElementById("confirmBtn");
  const loadingScreen = document.getElementById("loading-screen");

  confirmBtn.addEventListener("click", () => {
    loadingScreen.style.display = "flex";

    // Simulate sending delay
    setTimeout(() => {
      loadingScreen.style.display = "none";
      // Optionally redirect or show success message here
    }, 2000);
  });
});

