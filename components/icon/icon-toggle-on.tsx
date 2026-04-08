import { FC } from 'react';

interface IconToggleOnProps {
    className?: string;
}

const IconToggleOn: FC<IconToggleOnProps> = ({ className }) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className={className}
        >
            <rect x="1" y="4" width="14" height="8" rx="4" ry="4"/>
            <circle cx="11" cy="8" r="3" fill="white"/>
        </svg>
    );
};

export default IconToggleOn;