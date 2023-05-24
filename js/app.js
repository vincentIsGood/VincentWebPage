import {GeneralUtils, PositionUtils, ScrollUtils, ScrollUtilsOption, AnimationUtils} from "./utils.js";
import './scroll-timeline.js';

window.onload = ()=>{
    let scrollUtils = new ScrollUtils();

    AnimationUtils.initCharacters(document.querySelector(".top-bar .name-item"));
    AnimationUtils.animateCharacters(document.querySelector(".top-bar .name-item"));

    GeneralUtils.iterate(document.querySelectorAll(".intro .title"), AnimationUtils.initCharacters);
    GeneralUtils.iterate(document.querySelectorAll(".projects .title"), AnimationUtils.initCharacters);

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

    scrollUtils.registerListener({
        callback: (a, b, c, finish)=>{
            GeneralUtils.iterate(document.querySelectorAll(".intro .title"), (ele)=>{
                AnimationUtils.animateCharacters(ele)
            });
            finish();
        },
        option: new ScrollUtilsOption({
            startY: 0,
            delay: 500,
        }),
    });
    scrollUtils.registerListener({
        callback: (a, b, c, finish)=>{
            GeneralUtils.iterate(document.querySelectorAll(".projects .title"), (ele)=>{
                AnimationUtils.animateCharacters(ele)
            });
            finish();
        },
        option: new ScrollUtilsOption({
            startY: PositionUtils.absPos(document.querySelector(".projects")).y - 100,
        }),
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

    GeneralUtils.iterate(document.querySelectorAll(".intro .photo-card"), (element, i)=>{
        let offset = PositionUtils.offsetToCenter(element, document.querySelector(".intro .collector-view"), {x: 0, y: -50});
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

    scrollUtils.registerDocumentScroll();
}