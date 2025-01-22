document.addEventListener("DOMContentLoaded", () => {
    // Get references to the DOM elements
    const gallery = document.getElementById("gallery");
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const caption = document.getElementById("caption");
    const closeModal = document.querySelector(".close");

    const fileInput = document.getElementById("fileInput");
    const folderInput = document.getElementById("folderInput");
    const addImagesButton = document.getElementById("addImages");
    const deleteSelectedButton = document.getElementById("deleteSelected");
    const downloadZipButton = document.getElementById("downloadZip");
    const emailAttachmentButton = document.getElementById("emailAttachment");

    const customMonthDropdown = document.getElementById("customMonth");
    const customYearDropdown = document.getElementById("customYear");

    const showSelectedButton = document.getElementById("showSelectedImages");
    const backToGalleryButton = document.getElementById("backToGallery");
    let selectedImages = [];

    // Change the data structure to organize by year first, then month
    // Replace the existing months array declaration with:
    const imageData = {};  // Will store images as: imageData[year][month] = {folders: {}}

    // Function to add images with custom month and year
    const addImages = () => {
        const selectedMonth = parseInt(customMonthDropdown.value);
        const selectedYear = parseInt(customYearDropdown.value);

        if (isNaN(selectedMonth) || isNaN(selectedYear)) {
            alert("Please select a valid month and year.");
            return;
        }

        // Initialize year and month if they don't exist
        if (!imageData[selectedYear]) {
            imageData[selectedYear] = {};
        }
        if (!imageData[selectedYear][selectedMonth]) {
            imageData[selectedYear][selectedMonth] = { folders: {} };
        }

        // Combine files from both inputs
        const files = Array.from(fileInput.files).concat(Array.from(folderInput.files));

        if (files.length === 0) {
            alert("Please select files or a folder to upload.");
            return;
        }

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                console.log(`Skipping non-image file: ${file.name}`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const folderName = file.webkitRelativePath.split('/')[0] || 'Uncategorized';

                // Initialize folder if it doesn't exist
                if (!imageData[selectedYear][selectedMonth].folders[folderName]) {
                    imageData[selectedYear][selectedMonth].folders[folderName] = [];
                }

                // Add the image to the folder
                imageData[selectedYear][selectedMonth].folders[folderName].push({
                    src: e.target.result,
                    name: file.name,
                    year: selectedYear,
                    month: selectedMonth
                });

                renderGallery();
            };
            reader.readAsDataURL(file);
        });

        fileInput.value = "";
        folderInput.value = "";
    };

    // Utility function to render the gallery
    const renderGallery = () => {
        gallery.innerHTML = "";

        // Sort years in descending order
        const sortedYears = Object.keys(imageData).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const yearData = imageData[year];
            
            // Sort months in ascending order
            const sortedMonths = Object.keys(yearData).sort((a, b) => a - b);

            sortedMonths.forEach(month => {
                const { folders } = yearData[month];

                Object.entries(folders).forEach(([folder, images]) => {
                    if (images.length > 0) {
                        const monthContainer = document.createElement("div");
                        monthContainer.classList.add("month-container");

                        // Create a title for the month and year
                        const monthYearTitle = document.createElement("h3");
                        monthYearTitle.classList.add("month-year-title");
                        monthYearTitle.innerText = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
                        monthContainer.appendChild(monthYearTitle);

                        if (folder !== 'Uncategorized') {
                            const folderTitle = document.createElement("h4");
                            folderTitle.classList.add("folder-title");
                            folderTitle.innerText = folder;
                            monthContainer.appendChild(folderTitle);
                        }

                        // Create a "Select All" checkbox
                        const selectAllContainer = document.createElement("div");
                        selectAllContainer.classList.add("select-all-container");

                        const selectAllCheckbox = document.createElement("input");
                        selectAllCheckbox.type = "checkbox";
                        selectAllCheckbox.classList.add("select-all-checkbox");
                        selectAllCheckbox.id = `select-all-${year}-${month}-${folder}`;
                        selectAllCheckbox.addEventListener("change", (e) => {
                            const checkboxes = monthContainer.querySelectorAll(".checkbox");
                            checkboxes.forEach(checkbox => {
                                checkbox.checked = e.target.checked;
                            });
                        });

                        const selectAllLabel = document.createElement("label");
                        selectAllLabel.htmlFor = selectAllCheckbox.id;
                        selectAllLabel.innerText = "Select All";

                        selectAllContainer.appendChild(selectAllCheckbox);
                        selectAllContainer.appendChild(selectAllLabel);
                        monthContainer.appendChild(selectAllContainer);

                        const monthImages = document.createElement("div");
                        monthImages.classList.add("d-flex", "flex-wrap");

                        // Render images
                        images.forEach(({ src, name }, index) => {
                            const imageContainer = document.createElement("div");
                            imageContainer.classList.add("image-container");

                            const checkbox = document.createElement("input");
                            checkbox.type = "checkbox";
                            checkbox.classList.add("checkbox");
                            checkbox.id = `checkbox-${year}-${month}-${folder}-${index}`;

                            const img = document.createElement("img");
                            img.src = src;
                            img.alt = name;
                            img.classList.add("gallery-image");

                            img.addEventListener("click", (e) => {
                                e.preventDefault();
                                openModal(src, name);
                            });

                            imageContainer.appendChild(checkbox);
                            imageContainer.appendChild(img);
                            monthImages.appendChild(imageContainer);
                        });

                        monthContainer.appendChild(monthImages);
                        gallery.appendChild(monthContainer);
                    }
                });
            });
        });
    };


      // Function to download selected images as a ZIP file
      const downloadAsZip = () => {
        const zip = new JSZip();
        let hasSelectedImages = false;

        // Get all month containers
        const monthContainers = document.querySelectorAll('.month-container');
        
        // Iterate through each month container
        monthContainers.forEach(container => {
            const checkboxes = container.querySelectorAll('.checkbox');
            const images = container.querySelectorAll('.gallery-image');
            
            // Add checked images to zip
            checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    const img = images[index];
                    const imgSrc = img.src;
                    const imgName = img.alt;
                    
                    // Extract base64 data from src
                    const imgData = imgSrc.split(',')[1];
                    zip.file(imgName, imgData, { base64: true });
                    hasSelectedImages = true;
                }
            });
        });

        if (!hasSelectedImages) {
            alert("Please select at least one image to download.");
            return;
        }

        // Generate and download the ZIP file
        zip.generateAsync({ type: "blob" })
            .then((content) => {
                saveAs(content, "selected_images.zip");
            })
            .catch(error => {
                console.error('Error creating zip:', error);
                alert('Error creating zip file. Please try again.');
            });
    };



    // Function to delete selected images from the gallery
    const deleteSelectedImages = () => {
        Object.keys(imageData).forEach(year => {
            Object.keys(imageData[year]).forEach(month => {
                Object.entries(imageData[year][month].folders).forEach(([folder, images]) => {
                    imageData[year][month].folders[folder] = images.filter((image, index) => {
                        const checkbox = document.getElementById(`checkbox-${year}-${month}-${folder}-${index}`);
                        return !checkbox || !checkbox.checked;
                    });
                });

                // Clean up empty folders
                Object.keys(imageData[year][month].folders).forEach(folder => {
                    if (imageData[year][month].folders[folder].length === 0) {
                        delete imageData[year][month].folders[folder];
                    }
                });

                // Clean up empty months
                if (Object.keys(imageData[year][month].folders).length === 0) {
                    delete imageData[year][month];
                }
            });

            // Clean up empty years
            if (Object.keys(imageData[year]).length === 0) {
                delete imageData[year];
            }
        });

        renderGallery();
    };



    // Function to email selected images as attachments
    const emailAttachment = () => {
        const selectedImages = [];
        Object.values(imageData).forEach(yearData => {
            Object.values(yearData).forEach(monthData => {
                Object.values(monthData.folders).forEach(images => {
                    images.forEach(({ name }, index) => {
                        const checkbox = gallery.querySelectorAll(".checkbox")[index];
                        if (checkbox.checked) {
                            selectedImages.push(name);  // Collect selected image names
                        }
                    });
                });
            });
        });

        if (selectedImages.length > 0) {
            // Encode the selected image names and create the mailto link
            const encodedImages = encodeURIComponent(selectedImages.join("\n"));
            const mailtoLink = `mailto:?subject=Image Attachments&body=${encodedImages}`;
            window.location.href = mailtoLink;  // Open the email client with the attachments
        } else {
            alert("Please select at least one image to attach.");
        }
    };

    // Function to open the modal with the clicked image
    const openModal = (src, name) => {
        modal.style.display = "block";
        modalImage.src = src;
        caption.innerText = name;

        // Hide all checkboxes when modal is opened
        document.querySelectorAll(".checkbox").forEach(checkbox => {
            checkbox.classList.add("hidden");
        });
    };

    // Close the modal when the user clicks the close button
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";

        // Show all checkboxes again when modal is closed
        document.querySelectorAll(".checkbox").forEach(checkbox => {
            checkbox.classList.remove("hidden");
        });
    });

    // Close the modal if the user clicks outside the image
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";

            // Show all checkboxes again when modal is closed
            document.querySelectorAll(".checkbox").forEach(checkbox => {
                checkbox.classList.remove("hidden");
            });
        }
    });

    // Function to dynamically add months to the dropdown
    const populateMonthDropdown = () => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        months.forEach((month, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = month;
            customMonthDropdown.appendChild(option);
        });
    };

    // Function to dynamically add years to the dropdown
    const populateYearDropdown = () => {
        const currentYear = new Date().getFullYear();

        for (let year = 2016; year <= currentYear; year++) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            customYearDropdown.appendChild(option);
        }
    };

    // Initial population of dropdowns
    populateMonthDropdown();
    populateYearDropdown();

    // Event listeners for the buttons
    addImagesButton.addEventListener("click", addImages);
    deleteSelectedButton.addEventListener("click", deleteSelectedImages);
    downloadZipButton.addEventListener("click", downloadAsZip);
    emailAttachmentButton.addEventListener("click", emailAttachment);

    // Initial rendering of the gallery
    renderGallery();

    const showSelectedImagesView = () => {
        updateSelectedImages();
        if (selectedImages.length === 0) {
            alert("Please select at least one image to display.");
            return;
        }

        gallery.innerHTML = "";
        const selectedContainer = document.createElement("div");
        selectedContainer.classList.add("selected-images-container");

        selectedImages.forEach((image, index) => {
            const imageContainer = document.createElement("div");
            imageContainer.classList.add("image-container");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("checkbox");
            checkbox.checked = true;
            checkbox.id = `selected-checkbox-${index}`;

            const img = document.createElement("img");
            img.src = image.src;
            img.alt = image.displayName;
            img.classList.add("gallery-image");

            const nameLabel = document.createElement("div");
            nameLabel.classList.add("image-path");
            nameLabel.textContent = image.displayName;

            img.addEventListener("click", () => openModal(image.src, image.displayName));

            imageContainer.appendChild(checkbox);
            imageContainer.appendChild(img);
            imageContainer.appendChild(nameLabel);
            selectedContainer.appendChild(imageContainer);
        });

        gallery.appendChild(selectedContainer);
        showSelectedButton.style.display = "none";
        backToGalleryButton.style.display = "inline-block";
    };

    const backToMainGallery = () => {
        showSelectedButton.style.display = "inline-block";
        backToGalleryButton.style.display = "none";
        renderGallery();

        // Clear all checkboxes first
        document.querySelectorAll('.checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Only check the boxes for images that were actually selected
        selectedImages.forEach(selectedImage => {
            const checkbox = document.getElementById(`checkbox-${selectedImage.year}-${selectedImage.month}-${selectedImage.folder}-${selectedImage.index}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    };

    showSelectedButton.addEventListener("click", showSelectedImagesView);
    backToGalleryButton.addEventListener("click", backToMainGallery);

    const updateSelectedImages = () => {
        selectedImages = [];
        Object.keys(imageData).forEach(year => {
            Object.keys(imageData[year]).forEach(month => {
                Object.entries(imageData[year][month].folders).forEach(([folder, images]) => {
                    images.forEach((image, index) => {
                        const checkbox = document.getElementById(`checkbox-${year}-${month}-${folder}-${index}`);
                        if (checkbox && checkbox.checked) {
                            const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
                            const folderPath = folder === 'Uncategorized' ? '' : `${folder}/`;
                            selectedImages.push({
                                ...image,
                                displayName: `${monthName} ${year}/${folderPath}${image.name}`,
                                folder: folder,
                                index: index
                            });
                        }
                    });
                });
            });
        });
    };
});
