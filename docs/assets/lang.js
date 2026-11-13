document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-set-lang]');if(a){try{localStorage.setItem("ff-lang",a.getAttribute('data-set-lang'))}catch(err){}}});
