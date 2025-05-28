let analysisResults = [];
let uploadedCVFiles = [];
//Trigger file input when upload box is clicked
document.querySelector('.upload-box').addEventListener('click', () => {
  document.getElementById('cv-upload').click();
});

// Handle file selection via click
document.getElementById('cv-upload').addEventListener('change', (e) => {
  //console.log('Change event triggered');
  if (e.target.files.length === 0) return;
  uploadedCVFiles = Array.from(e.target.files);
  console.log("Files selected:", uploadedCVFiles);
  showUploadedFiles(uploadedCVFiles);

  e.target.value = ''; // Clear the input value to allow re-uploading the same file
});

//Drag and drop functionality
const uploadBox = document.querySelector('.upload-box');

uploadBox.addEventListener('dragover', (event) => {
  event.preventDefault();
  uploadBox.style.background = '#f0f8ff';
});

uploadBox.addEventListener('dragleave', () => {
  uploadBox.style.background = '';
});

uploadBox.addEventListener('drop', (event) => {
  event.preventDefault();
  uploadBox.style.background = '';
const newFiles = Array.from(event.dataTransfer.files);

// Filter out duplicates by name
newFiles.forEach(file => {
  if (!uploadedCVFiles.some(f => f.name === file.name)) {
    uploadedCVFiles.push(file);
  }
});

showUploadedFiles(uploadedCVFiles);

});
  
// Show uploaded files with PDF icon
function showUploadedFiles(files) {
  const container = document.getElementById('uploaded-files');
  container.innerHTML = '';

  if (files.length === 0) {
    container.textContent = 'No CVs uploaded yet.';
    return;
  }

  files.forEach(file => {
    const item = document.createElement('div');
    item.innerHTML = `📄 ${file.name}`;
    container.appendChild(item);
  });
}

//Analyze CV
async function analyzeCVs() {
    
    const keywordInput = document.getElementById('keywords').value;
    const keywordFile = document.getElementById('keyword-file').files[0];
    const fallbackCVFiles = document.getElementById('cv-upload').files;
    const cvFiles = uploadedCVFiles.length ? uploadedCVFiles : Array.from(fallbackCVFiles);
    

    if(!keywordInput && !keywordFile) {
        alert('Please enter keywords or upload a keyword file.');
        return;
    }

    if(cvFiles.length === 0) {
        alert('Please upload a CV file.');
        return;
    }

    const formData = new FormData();
    
    formData.append('keywords', keywordInput);
    if (keywordFile) {
          formData.append('keyword_file', keywordFile);
    } 
for (let file of cvFiles) {
  formData.append('cv_files', file);          
}
console.log("Sending request with CVs:", formData.getAll('cv_files'));
    try{
        const response = await fetch('http://127.0.0.1:5000/scan', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Server error: ' );
        }

        const data = await response.json();
        analysisResults = data.results;
        
        alert('CV analysis completed successfully!');
        document.getElementById('export-section').classList.remove('hidden');
    }catch (error) {
        console.error('Error during CV analysis:', error);
        alert('An error occurred while analyzing the CV. Please try again.');
    }   

}

//Export results
function exportResults() {
    if (analysisResults.length === 0) {
        alert('No results to export. Please analyze a CV first.');
        return;
    }
    const format = document.getElementById('export-format').value;
    if (format === 'csv'){
        exportCSV();
    }else if (format === 'json') {
        exportJSON();
    } else {
        alert('Please select a valid export format.');
    }

}
function exportCSV() {
    const today = new Date().toISOString().split('T')[0];
    let csv = "CV Name, Score, Matched Keywords\n";
    analysisResults.forEach(result => {
        csv += `${result.filename}, ${result.score}, ${result.matchedKeywords.join('; ')}\n`;
    });
    downloadBlob(csv, `cv_analysis_${today}.csv`, 'text/csv');
}
function exportJSON(){
    const json = JSON.stringify(analysisResults, null, 2);
    downloadBlob(json, 'cv_analysis.json', 'application/json');
}
function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    a.click();
    
}
document.getElementById('clear-cvs').addEventListener('click', () => {
  uploadedCVFiles = [];
  document.getElementById('cv-upload').value = ''; // Clears the hidden file input
  showUploadedFiles(uploadedCVFiles);

  // Optionally hide export section too
  document.getElementById('export-section').classList.add('hidden');
});
