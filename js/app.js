import {GeneralUtils, PositionUtils, ScrollUtils, ScrollUtilsOption, AnimationUtils, ScrollTemplates, resolveCssValue} from "./utils.js";
import './scroll-timeline.js';

const MOBILE_MODE = window.outerWidth < 1000;

let scrollUtils = new ScrollUtils();

window.onload = ()=>{
    // TODO: create loading screen (then clear it out at the bottom of this function)
    window.scrollUtils = scrollUtils; // for debug

    AnimationUtils.initCharacters(document.querySelector(".top-bar .name-item"));
    AnimationUtils.animateCharacters(document.querySelector(".top-bar .name-item"));
    GeneralUtils.iterate(document.querySelectorAll(".top-bar .menu-button"), (ele)=>{
        GeneralUtils.registerCssClassToggleClick(ele, document.querySelector(".top-bar .collapsable-menu"), "hidden", false);
    });

    scrollUtils.registerListener({
        callback: (a,b,c,finish,notFinish)=>{
            document.querySelector(".top-bar").classList.add("change-color");
            notFinish();
        },
        outsideCallback(){
            document.querySelector(".top-bar").classList.remove("change-color");
        },
        option: new ScrollUtilsOption({
            startY: PositionUtils.absPos(document.querySelector(".skills")).y,
        }),
    });

    setupIntro();
    setupSkills();
    setupProjects();

    scrollUtils.registerDocumentScroll();
    // clear out loading screen here
}

function setupIntro(){
    // GeneralUtils.iterate(document.getElementsByClassName('parallax-bg-shape'), (element)=>{
    //     element.animate(
    //         { transform: ['translateY(0)', 'translateY(20rem)']},
    //         {
    //             fill: 'both',
    //             timeline: new ScrollTimeline({
    //                 scrollOffsets: [
    //                     new CSSUnitValue(0, 'rem'),
    //                     new CSSUnitValue(20, 'rem')
    //                 ]
    //             }),
    //         }
    //     );
    // });

    GeneralUtils.iterate(document.querySelectorAll(".intro .top .title"), AnimationUtils.initCharacters);
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".intro .top .title"), 500, "-100vh");

    // GeneralUtils.iterate(document.querySelectorAll(".intro .photo-card"), (element, i, len)=>{
    //     let offset = PositionUtils.offsetToCenter(element, document.querySelector(".intro .collector-view"));
    //     element.style.left = `${offset.x}px`;
    //     element.style.top = `${offset.y}px`;
    //     element.style.setProperty("--rotate", (-30 + i*60/len) + "deg"); // range = 60deg (-30 to 30)

    //     element.addEventListener("click", ()=>{
    //         if(element.classList.contains("animating")){
    //             element.style.left = 0;
    //             element.style.top = 0;
    //         }else{
    //             element.style.left = `${offset.x}px`;
    //             element.style.top = `${offset.y}px`;
    //         }
    //         element.classList.toggle("animating");
    //     });
    // });
}

function setupSkills(){
    const skillsTimeline = document.querySelector(".skills .skills-timeline path");
    const timelinePathLength = skillsTimeline.getTotalLength();
    const timelineHeight = skillsTimeline.getBoundingClientRect().height;

    scrollUtils.registerListener({
        callback: (a,relativeYFromStart,relativeYFromEnd,finish, notFinish)=>{
            let offset = Math.max(0, Math.floor((timelineHeight + relativeYFromStart)/timelineHeight * timelinePathLength));
            skillsTimeline.style.strokeDashoffset = offset;
            notFinish();
        },
        outsideCallback: (scrollY, relativeYFromStart)=>{
            skillsTimeline.style.strokeDasharray = timelinePathLength;
            if(relativeYFromStart > 0)
                skillsTimeline.style.strokeDashoffset = timelinePathLength;
            else skillsTimeline.style.strokeDashoffset = 0;
        },
        option: new ScrollUtilsOption({
            startY: PositionUtils.absPos(skillsTimeline).y + resolveCssValue("-60vh"),
            endY: PositionUtils.absPos(skillsTimeline).y + timelineHeight,
        }),
    });

    const skillInfoPanels = document.querySelectorAll(".skills .skill-info");
    if(skillInfoPanels.length != document.querySelectorAll(".skills .skills-timeline circle").length){
        throw new Error("Illegal State: len(circle) != len(.skill-info)");
    }
    GeneralUtils.iterate(document.querySelectorAll(".skills .skills-timeline circle"), (element, i)=>{
        scrollUtils.registerListener({
            callback: (a,relativeYFromStart,c,finish, notFinish)=>{
                element.style.fill = "var(--color-bright)";
                element.style.r = 8;
                notFinish();
            },
            outsideCallback: ()=>{
                element.style.fill = "transparent";
                element.style.r = 4;
            },
            initCallback: ()=>{
                const absPos = PositionUtils.absPos(element);
                skillInfoPanels[i].style.left = absPos.x;
                skillInfoPanels[i].style.top = absPos.y;
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(element).y + resolveCssValue("-60vh"),
                endY: PositionUtils.absPos(skillsTimeline).y + timelineHeight,
            }),
        });
    });

    GeneralUtils.iterate(skillInfoPanels, (element)=>{
        const elementWidth = element.getBoundingClientRect().width;
        const overScreenRight = (PositionUtils.absPos(element).x + elementWidth * 2) >= window.outerWidth;
        scrollUtils.registerListener({
            callback: (a,relativeYFromStart,c, finish, notFinish)=>{
                element.style.opacity = 1;
                element.style.transform = `translateX(${elementWidth}px)`;
                if(overScreenRight)
                    element.style.transform = `translateX(-${elementWidth}px)`;
                notFinish();
            },
            outsideCallback: ()=>{
                element.style.opacity = 0;
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(element).y + resolveCssValue("-60vh"),
                endY: PositionUtils.absPos(skillsTimeline).y + timelineHeight,
                isInitSameAsOutside: true,
            }),
        });
    });
}

function setupProjects(){
    GeneralUtils.iterate(document.querySelectorAll(".projects .title"), AnimationUtils.initCharacters);
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".projects .top .title"), 0, "-70vh");
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".projects .bottom .title"), 0, "-70vh");

    let currentlySelectedIndex = 0;
    const projectDesc = document.querySelectorAll(".projects .bottom .right > div");
    const projectMenuItems = document.querySelectorAll(".projects .bottom .left > div");
    GeneralUtils.iterate(projectMenuItems, (ele, i)=>{
        ele.addEventListener("click", ()=>{
            projectMenuItems[currentlySelectedIndex].classList.remove("selected");
            projectDesc[currentlySelectedIndex].classList.add("hidden");
            ele.classList.add("selected");
            projectDesc[i].classList.remove("hidden");
            currentlySelectedIndex = i;
        });
    });
}

// function setupTransition(){
//     const transitionText = document.querySelector(".transition-text");
//     scrollUtils.registerListener({
//         callback(a,b,c,finish,notFinish,progress){
//             transitionText.querySelector("span").classList.remove("hidden");
//             notFinish();
//         },
//         outsideCallback(){
//             transitionText.querySelector("span").classList.add("hidden");
//         },
//         option: new ScrollUtilsOption({
//             startY: PositionUtils.absPos(transitionText).y - resolveCssValue("20vh"),
//             endY: PositionUtils.absPos(transitionText).y + resolveCssValue("20vh"),
//         }),
//     });
// }