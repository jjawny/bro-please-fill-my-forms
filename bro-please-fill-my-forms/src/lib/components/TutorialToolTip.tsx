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
  const currentTutorialStep = useGlobalStore((state) => state.currentTutorialStep);

  return (
    <ToolTipWrapper
      content={content}
      open={currentTutorialStep === step}
      backgroundColorHex="#0047d8"
      contentClassName="!text-white"
    >
      {children}
    </ToolTipWrapper>
  );
}
