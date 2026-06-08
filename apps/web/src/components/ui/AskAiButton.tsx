import React from 'react';
import styled from 'styled-components';

interface AskAiButtonProps {
  onClick?: () => void;
  className?: string;
  isGenerating?: boolean;
  type?: 'button' | 'submit';
}

export const AskAiButton: React.FC<AskAiButtonProps> = ({
  onClick,
  className,
  isGenerating,
  type = 'button',
}) => {
  return (
    <StyledWrapper className={className} onClick={onClick}>
      <div className="btn-wrapper">
        <button className="btn" type={type} disabled={isGenerating}>
          <svg
            className="btn-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
            />
          </svg>
          <div className="txt-wrapper">
            <div className={`txt-1 ${isGenerating ? 'show-anim' : ''}`}>
              <span>Ask</span>
            </div>
          </div>
        </button>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .btn-wrapper {
    position: relative;
    display: inline-block;
  }
  .txt-1 {
    color: white;
  }

  .btn {
    position: relative;

    display: flex;
    align-items: center;
    gap: 8px;

    height: 36px;

    padding: 0 14px;

    border-radius: 999px;

    border: 1px solid rgba(255, 255, 255, 0.08);

    background: linear-gradient(
      180deg,
      rgba(28, 28, 32, 1),
      rgba(16, 16, 18, 1)
    );

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 6px 20px rgba(0, 0, 0, 0.18);

    transition: all 0.2s ease;
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }

  .btn::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08),
      transparent 40%
    );
    pointer-events: none;
  }

  .btn-letter {
    position: relative;
    display: inline-block;
    color: rgba(255, 255, 255, 0.92);
    transition:
      color var(--transition),
      text-shadow var(--transition),
      opacity var(--transition);
  }

  .btn-svg {
    width: 14px;
    height: 14px;

    fill: currentColor;

    color: rgba(255, 255, 255, 0.9);

    filter: none;

    animation: none;
  }

  /* Focus state */
  .txt-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    min-width: auto;
  }

  .txt-wrapper {
    display: flex;
    align-items: center;
  }

  .btn-text {
    color: rgba(255, 255, 255, 0.95);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
  }

  .btn:focus .txt-1,
  .txt-1.hide-anim {
    animation: opacity-anim 0.3s ease-in-out forwards;
  }
  .btn:focus .txt-2,
  .txt-2.show-anim {
    animation: opacity-anim 0.3s ease-in-out reverse forwards;
  }

  @keyframes opacity-anim {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .btn:focus .btn-letter,
  .btn:active .btn-letter {
    animation:
      focused-letter-anim 1s ease-in-out forwards,
      letter-anim 1.2s ease-in-out infinite;
    animation-delay: 0s, 1s;
  }

  @keyframes focused-letter-anim {
    0%,
    100% {
      filter: blur(0px);
    }
    50% {
      transform: scale(2);
      filter: blur(10px) brightness(150%)
        drop-shadow(-36px 12px 12px hsl(var(--highlight-color-hue), 100%, 70%));
    }
  }

  .btn:focus .btn-svg,
  .btn:active .btn-svg {
    animation-duration: 1.2s;
    animation-delay: 0.2s;
  }

  .btn:focus::before,
  .btn:active::before {
    box-shadow:
      0 -8px 12px -6px #fff3 inset,
      0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 20%) inset,
      1px 1px 1px #fff3,
      2px 2px 2px #fff1,
      -1px -1px 1px #0002,
      -2px -2px 2px #0001;
  }
  .btn:focus::after,
  .btn:active::after {
    opacity: 0.6;
    mask-image: linear-gradient(0deg, #fff, transparent);
    filter: brightness(100%);
  }

  /* Active state */
  .btn:active {
    border: solid 1px hsla(var(--highlight-color-hue), 100%, 80%, 70%);
    background-color: hsla(var(--highlight-color-hue), 50%, 20%, 0.5);
  }
  .btn:active::before {
    box-shadow:
      0 -8px 12px -6px #fffa inset,
      0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 80%) inset,
      1px 1px 1px #fff4,
      2px 2px 2px #fff2,
      -1px -1px 1px #0002,
      -2px -2px 2px #0001;
  }
  .btn:active::after {
    opacity: 1;
    mask-image: linear-gradient(0deg, #fff, transparent);
    filter: brightness(200%);
  }
  .btn:active .btn-letter {
    text-shadow: 0 0 1px hsla(var(--highlight-color-hue), 100%, 90%, 90%);
    animation: none;
  }

  /* Hover state */
  .btn:hover {
    transform: translateY(-1px);

    border-color: rgba(255, 255, 255, 0.14);

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 10px 28px rgba(0, 0, 0, 0.24);
  }

  .btn:hover::before {
    box-shadow:
      0 -8px 8px -6px #fffa inset,
      0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 30%) inset,
      1px 1px 1px #fff2,
      2px 2px 2px #fff1,
      -1px -1px 1px #0002,
      -2px -2px 2px #0001;
  }
  .btn:active {
    transform: translateY(1px) scale(0.98);
  }

  .btn:hover::after {
    opacity: 1;
    mask-image: linear-gradient(0deg, #fff, transparent);
  }

  .btn:hover .btn-svg {
    fill: #fff;
    filter: drop-shadow(0 0 3px hsl(var(--highlight-color-hue), 100%, 70%))
      drop-shadow(0 -4px 6px #0009);
    animation: none;
  }
`;
