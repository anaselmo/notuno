import { useEffect } from "react";

/**
 * This hook will display a confirmation dialog before the user **leaves** or **reloads** the page.
 * This is useful when the user has unsaved changes in a form, leaves a p2p room, etc.
 */
export const useBeforeUnloadConfirmation = () => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // Legacy method for cross browser support
      return ""; // Legacy method for cross browser support
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};
