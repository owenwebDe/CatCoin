import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin);

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin };
