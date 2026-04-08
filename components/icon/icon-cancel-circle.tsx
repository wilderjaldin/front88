import { FC } from 'react';

interface IconCancelCircleProps {
    className?: string;
}

const IconCancelCircle: FC<IconCancelCircleProps> = ({ className }) => {
    return (
        <svg width="22px" height="22px" viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Layer_2"> <g id="invisible_box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="icons_Q2"> <path d="M24,2A22,22,0,1,0,46,24,21.9,21.9,0,0,0,24,2Zm8.3,27.5a2.1,2.1,0,0,1,.4,2.7,2,2,0,0,1-3.1.2L24,26.8l-5.6,5.6a2,2,0,0,1-3.1-.2,2.1,2.1,0,0,1,.4-2.7L21.2,24l-5.5-5.5a2.2,2.2,0,0,1-.4-2.7,2,2,0,0,1,3.1-.2L24,21.2l5.6-5.6a2,2,0,0,1,3.1.2,2.2,2.2,0,0,1-.4,2.7L26.8,24Z"></path> </g> </g> </g></svg>
    );
};

export default IconCancelCircle;
