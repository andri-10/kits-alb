document.addEventListener("DOMContentLoaded", () => {
    const editProfileButton = document.querySelector(".edit-profile-btn");
    const popupBackdrop = document.createElement("div");
    popupBackdrop.className = "popup-backdrop";
    document.body.appendChild(popupBackdrop);
    const currentImage = document.getElementById("currentImg").getAttribute("src");
    const removeImgStyle = (currentImage === "images/default-profile.png") ? 'none' : 'block';
    const popupForm = document.createElement("div");
    popupForm.className = "popup-form";
    popupForm.innerHTML = `
        <h3>Edit Profile</h3>
        <img id="imgPreview" src="${currentImage}" alt="Image Preview" style="width: 200px; height: 200px; margin-bottom: 10px;"><br>
        
        <div class="username-section" >
        <label for="username-field">Username:</label>
        <input type="text" id="username-field" style="display:inline" placeholder="Enter your new username" required><br>
        </div>
        <div class="image-section">
        <label for="profile-image">Profile Picture:</label>
        <input type="file" id="profile-image" accept="image/*"><br><br>
        <button type="button" class="remove-picture-btn" style="display: ${removeImgStyle}">Remove Profile Picture</button>
        </div>

        <div class="form-buttons">
        <button type="button" class="submit-btn">Save Changes</button>
        <button type="button" class="cancel-btn">Cancel</button>
        </div>
        <div id="popup-message" class="success-message" style="display: none;"></div>
    `;
    document.body.appendChild(popupForm);
  
    const closePopup = () => {
        popupBackdrop.style.display = "none";
        popupForm.style.display = "none";
    };
  
    const showPopup = () => {
        popupBackdrop.style.display = "block";
        popupForm.style.display = "flex";
        popupForm.style.flexDirection = "column";
        popupForm.style.justifyContent = "center";
        const usernameDisplay = document.getElementById("username-field");
        usernameDisplay.textContent = "Loading...";
  
        fetch("backend/get-username.php")
            .then((response) => response.json())
            .then((data) => {
                if (data.success && usernameDisplay) {
                    usernameDisplay.value = data.username || "User";
                } else {
                    usernameDisplay.value = "Error loading username";
                }
            })
            .catch(() => {
                usernameDisplay.value = "Error loading username";
            });
    };
  
    editProfileButton.addEventListener("click", showPopup);
  
    popupBackdrop.addEventListener("click", closePopup);
  
    popupForm.querySelector(".cancel-btn").addEventListener("click", closePopup);
  
    popupForm.querySelector(".submit-btn").addEventListener("click", () => {
        const newUsername = document.getElementById("username-field").value.trim();
        const profileImage = document.getElementById("profile-image").files[0];
  
        const formData = new FormData();
        if (newUsername) formData.append("new_username", newUsername);
        if (profileImage) formData.append("profile_image", profileImage);
  
        fetch("backend/update-profile.php", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                const message = document.getElementById("popup-message");
                if (data.success) {
                    message.textContent = data.message;
                    message.style.color = "green";
                    message.style.display = "block";
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    message.textContent = data.message;
                    message.style.color = "red";
                    message.style.display = "block";
                }
            })
            .catch(() => {
                const message = document.getElementById("popup-message");
                message.textContent = "An error occurred. Please try again.";
                message.style.color = "red";
                message.style.display = "block";
            });
    });
  
    popupForm.querySelector(".remove-picture-btn").addEventListener("click", () => {
        const formData = new FormData();
        formData.append("remove_profile_picture", true);
    
        fetch("backend/update-profile.php", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                const message = document.getElementById("popup-message");
                if (data.success) {
                    message.textContent = "Profile picture removed!";
                    message.style.color = "green";
                    message.style.display = "block";
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    message.textContent = data.message;
                    message.style.color = "red";
                    message.style.display = "block";
                }
            })
            .catch(() => {
                const message = document.getElementById("popup-message");
                message.textContent = "An error occurred. Please try again.";
                message.style.color = "red";
                message.style.display = "block";
            });
    });
    
    const profileImageInput = document.getElementById("profile-image");
    const imgPreview = document.getElementById("imgPreview");
  
    profileImageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
  
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                imgPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });
  
   
    const saveChangesBtn = document.getElementById("submit-btn");
  
  
    

    
    if(saveChangesBtn) saveChangesBtn.addEventListener("click", () => {
        const newUsername = usernameInput.value.trim();
  
        if (/^[a-zA-Z0-9]+$/.test(newUsername)) {
            const formData = new FormData();
            formData.append("new_username", newUsername);
  
            fetch("backend/update-profile.php", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        console.log("Data success")
                        usernameDisplay.textContent = newUsername;
                        usernameInput.style.display = "none";
                        saveChangesBtn.style.display = "none";
                        
                        usernameDisplay.style.display = "inline-block";
                    } else {
                        alert(data.message || "Error updating username.");
                    }
                })
                .catch(() => {
                    alert("An error occurred. Please try again.");
                });
        } else {
            alert("Username must contain only letters and numbers.");
        }
    });
  });
  