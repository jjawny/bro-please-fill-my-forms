import { TutorialStepType } from "~/lib/enums/TutorialStep";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import ToolTipWrapper from "./ToolTipWrapper";

export default function TutorialToolTip({
  content,
  step,
  children,
}: {
  content: string;
  step: TutorialStepType;
  children?: React.ReactNode;
}) {
  const getCurrentTutorialStep = useGlobalStore((state) => state.getCurrentTutorialStep);

  return (
    <ToolTipWrapper
      content={content}
      open={getCurrentTutorialStep() === step ? true : false}
      backgroundColorHex="#0047d8"
      contentClassName="!text-white"
    >
      {children}
    </ToolTipWrapper>
  );
}
