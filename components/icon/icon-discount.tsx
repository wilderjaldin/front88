import { FC } from 'react';

interface IconDiscountProps {
    className?: string;
}

const IconDiscount: FC<IconDiscountProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
                <g id="Layer_1"></g> 
                <g id="Layer_2"> <g> 
                    <polygon fill="none" points=" 2,20 18,4 28,4 28,14 12,30 " stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2"></polygon> 
                    <circle cx="23" cy="9" fill="none" r="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2"></circle> 
                    <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" x1="24" x2="30" y1="8" y2="2"></line> 
                    <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" x1="17" x2="9" y1="11" y2="19"></line> 
                    <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" x1="21" x2="17" y1="15" y2="19"></line>
                     </g> </g> </g></svg>

    );
};

export default IconDiscount;
