window.onload = function() {

    const projectHeadings = document.querySelectorAll('.project-heading');
  
    projectHeadings.forEach((projectHeading) => {
      projectHeading.addEventListener('click', () => {
        // Toggle the active class on the clicked project heading
        projectHeading.classList.toggle('active');
        
        // Remove the active class from all other project headings
        projectHeadings.forEach((otherProjectHeading) => {
          if (otherProjectHeading !== projectHeading) {
            otherProjectHeading.classList.remove('active');
          }
        });
      });
    });
  }