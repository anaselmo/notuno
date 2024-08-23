/* eslint-disable react-hooks/rules-of-hooks */
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { BeatLoader } from "react-spinners";

import "./Button.css";
import { ButtonColorScheme, ButtonVariant } from "./types";

export type ButtonProps = React.JSX.IntrinsicElements["button"] & {
  variant?: ButtonVariant;
  colorScheme?: ButtonColorScheme;
  disabled?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "solid",
      colorScheme = "primary",
      disabled = false,
      loading = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [buttonWidth, setButtonWidth] = useState<number | null>(null);
    const [buttonHeight, setButtonHeight] = useState<number | null>(null);
    const buttonRef =
      (ref as React.RefObject<HTMLButtonElement>) ||
      useRef<HTMLButtonElement>(null);

    useEffect(() => {
      // Ensure the button is not loading and the width hasn't been set yet
      if (!loading && buttonRef.current && buttonWidth === null) {
        const {
          current: { offsetWidth: width, offsetHeight: height },
        } = buttonRef;
        setButtonWidth(width);
        setButtonHeight(height);
      }
    }, [loading, buttonRef, buttonWidth]);

    const isActive = !disabled && !loading;
    const activeClass = !isActive ? "disabled" : "";
    console.log(
      `button-text-${variant}-${colorScheme}${!isActive ? `-${activeClass}` : ""}`,
    );

    return (
      <button
        ref={buttonRef}
        className={`${variant}-${colorScheme}${!isActive ? `-${activeClass}` : ""}`}
        disabled={!isActive}
        style={{ width: buttonWidth, height: buttonHeight }}
        {...props}
      >
        {loading ? (
          <BeatLoader
            size="7px"
            className={`button-text-${variant}-${colorScheme}${!isActive ? `-${activeClass}` : ""}`}
          />
        ) : (
          children
        )}
      </button>
    );
  },
);
