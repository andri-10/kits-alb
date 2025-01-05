document.addEventListener("DOMContentLoaded", () => {
  const editProfileButton = document.querySelector(".edit-profile-btn");
  const popupBackdrop = document.createElement("div");
  popupBackdrop.className = "popup-backdrop";
  document.body.appendChild(popupBackdrop);

  const popupForm = document.createElement("div");
  popupForm.className = "popup-form";
  popupForm.innerHTML = `
      <h3>Edit Profile</h3>
      <div id="username-section">
          <span id="username-display">Loading...</span>
          <a href="#" id="change-username-link">Change Username</a>
          <form id="username-form" style="display: none;">
              <input type="text" id="username-input" placeholder="Enter New Username" pattern="[a-zA-Z0-9]+" title="Only letters and numbers allowed">
              <button type="button" id="save-username" style="display: none;">Save</button>
              <button type="button" id="cancel-username" style="display: none;">Cancel</button>
          </form>
      </div>
      <label for="profile-image">Profile Picture:</label>
      <input type="file" id="profile-image" accept="image/*">
      <button type="button" class="submit-btn">Save Changes</button>
      <button type="button" class="cancel-btn">Cancel</button>
      <button type="button" class="remove-picture-btn">Remove Profile Picture</button>
      <div id="popup-message" class="success-message" style="display: none;"></div>
  `;
  document.body.appendChild(popupForm);

  const closePopup = () => {
      popupBackdrop.style.display = "none";
      popupForm.style.display = "none";
  };

  const showPopup = () => {
      popupBackdrop.style.display = "block";
      popupForm.style.display = "block";

      // Fetch and display current username
      const usernameDisplay = document.getElementById("username-display");
      usernameDisplay.textContent = "Loading..."; // Temporary message while fetching

      fetch("backend/get-username.php")
          .then((response) => response.json())
          .then((data) => {
              if (data.success && usernameDisplay) {
                  usernameDisplay.textContent = data.username || "User"; // Display fetched username
              } else {
                  usernameDisplay.textContent = "Error loading username"; // Fallback message
              }
          })
          .catch(() => {
              usernameDisplay.textContent = "Error loading username";
          });
  };

  editProfileButton.addEventListener("click", showPopup);

  popupBackdrop.addEventListener("click", closePopup);

  popupForm.querySelector(".cancel-btn").addEventListener("click", closePopup);

  popupForm.querySelector(".submit-btn").addEventListener("click", () => {
      const newUsername = document.getElementById("username-input").value.trim();
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

  // Handle Change Username functionality
  const usernameEditLink = document.getElementById("change-username-link");
  const usernameDisplay = document.getElementById("username-display");
  const usernameInput = document.getElementById("username-input");
  const saveUsernameBtn = document.getElementById("save-username");
  const cancelUsernameBtn = document.getElementById("cancel-username");

  usernameEditLink.addEventListener("click", (e) => {
      e.preventDefault();

      // Debug log to check if the event is being triggered
      console.log("Change Username link clicked!");

      // Check if elements are already shown or hidden
      if (usernameDisplay && usernameInput && saveUsernameBtn && cancelUsernameBtn) {
          usernameDisplay.style.display = "none"; // Hide the displayed username
          usernameInput.style.display = "inline-block"; // Show the input field
          saveUsernameBtn.style.display = "inline-block"; // Show Save button
          cancelUsernameBtn.style.display = "inline-block"; // Show Cancel button
          usernameEditLink.style.display = "none"; // Hide the Change Username link
      }
  });

  cancelUsernameBtn.addEventListener("click", () => {
      usernameDisplay.style.display = "inline-block"; // Show the username
      usernameInput.style.display = "none"; // Hide the input field
      saveUsernameBtn.style.display = "none"; // Hide Save button
      cancelUsernameBtn.style.display = "none"; // Hide Cancel button
      usernameEditLink.style.display = "inline-block"; // Show the Change Username link again
  });

  saveUsernameBtn.addEventListener("click", () => {
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
                      usernameDisplay.textContent = newUsername;
                      usernameInput.style.display = "none";
                      saveUsernameBtn.style.display = "none";
                      cancelUsernameBtn.style.display = "none";
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
