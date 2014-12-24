(function () {
    var open_link = document.querySelector("#open_link");
    var close_link = document.querySelector("#close_link");
    var menu = document.querySelector("#menu");
    var header = document.querySelector("#header");
    
    open_link.addEventListener("click", function(event){
        event.preventDefault;
        //menu.style.opacity=1;
        menu.classList.remove("main_menu--hidden");
        close_link.classList.remove("main_page_header__main_menu_button--hidden");
        open_link.classList.add("main_page_header__main_menu_button--hidden");
        header.classList.add("main_page_header__menu_container--menu_open");
    });
    
    close_link.addEventListener("click", function(event){
        event.preventDefault;
        
        menu.classList.add("main_menu--hidden");
        close_link.classList.add("main_page_header__main_menu_button--hidden");
        open_link.classList.remove("main_page_header__main_menu_button--hidden");
        header.classList.remove("main_page_header__menu_container--menu_open");
    });
    
    
})();