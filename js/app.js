import {GeneralUtils, PositionUtils, ScrollUtils, ScrollUtilsOption, AnimationUtils, ScrollTemplates, resolveCssValue} from "./utils.js";
import './scroll-timeline.js';

let scrollUtils = new ScrollUtils();

window.onload = ()=>{
    // TODO: create loading screen (then clear it out at the bottom of this function)
    // window.scrollUtils = scrollUtils; // for debug

    AnimationUtils.initCharacters(document.querySelector(".top-bar .name-item"));
    AnimationUtils.animateCharacters(document.querySelector(".top-bar .name-item"));

    GeneralUtils.iterate(document.getElementsByClassName('parallax-bg-shape'), (element)=>{
        element.animate(
            { transform: ['translateY(0)', 'translateY(20rem)']},
            {
                fill: 'both',
                timeline: new ScrollTimeline({
                    scrollOffsets: [
                        new CSSUnitValue(0, 'rem'),
                        new CSSUnitValue(20, 'rem')
                    ]
                }),
            }
        );
    });

    setupIntro();
    setupProjects();

    scrollUtils.registerDocumentScroll();
    // clear out loading screen here
}

function setupIntro(){
    GeneralUtils.iterate(document.querySelectorAll(".intro .title"), AnimationUtils.initCharacters);
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".intro .left .title"), 500, "-10rem");
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".intro .right .title"), 500, "-10rem");
    
    GeneralUtils.iterate(document.querySelectorAll(".intro .photo-card"), (element, i)=>{
        let offset = PositionUtils.offsetToCenter(element, 
            document.querySelector(".intro .collector-view"), {x: 0, y: "-8rem"});
        element.style.left = `${offset.x}px`;
        element.style.top = `${offset.y}px`;

        element.addEventListener("click", ()=>{
            if(element.classList.contains("animating")){
                element.style.left = 0;
                element.style.top = 0;
            }else{
                element.style.left = `${offset.x}px`;
                element.style.top = `${offset.y}px`;
            }
            element.classList.toggle("animating");
        });
    });

    GeneralUtils.iterate(document.querySelectorAll(".intro .collapsable"), (element)=>{
        GeneralUtils.registerCssClassToggle(element, element.querySelector(".desc"), "hidden");
        element.animate(
            [
                { opacity: "0", transform: "translateX(-10rem)" }, 
                { opacity: "1", transform: "translateX(0)" }
            ], // same as { opacity: ["0", "1"] }
            {
                fill: "forwards",
                duration: 500,
            }
        );
    });
}

function setupProjects(){
    GeneralUtils.iterate(document.querySelectorAll(".projects .title"), AnimationUtils.initCharacters);
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".projects .top .title"), 0, "-80vh");
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".projects .bottom .title"), 0, "-80vh");

    GeneralUtils.iterate(document.querySelectorAll(".projects .collapsable"), (element, i)=>{
        GeneralUtils.registerCssClassToggle(element, element.querySelector(".desc"), "hidden");
        element.style.transform = "translateX(-100vw)";
        scrollUtils.registerListener({
            callback: (a,b,c,finish)=>{
                element.animate(
                    [
                        { opacity: "0", transform: "translate(-100vw, 20rem)" }, 
                        { opacity: "1", transform: "translate(0, 0)" }
                    ],
                    {
                        fill: "forwards",
                        duration: 500,
                        delay: i*200,
                    }
                );
                finish();
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(document.querySelector(".projects .title")).y + resolveCssValue("-80vh"),
            }),
        });
    });
}