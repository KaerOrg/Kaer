import './StepBreadcrumb.css'

interface StepBreadcrumbProps {
  steps: string[]
  currentStep: number
}

export function StepBreadcrumb({ steps, currentStep }: StepBreadcrumbProps) {
  return (
    <div className="step-breadcrumb">
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isDone = stepNumber < currentStep
        const isActive = stepNumber === currentStep
        const stateClass = isDone
          ? ' step-breadcrumb__step--done'
          : isActive
            ? ' step-breadcrumb__step--active'
            : ''

        return (
          <span key={stepNumber} className="step-breadcrumb__item">
            {index > 0 && <span className="step-breadcrumb__arrow">→</span>}
            <span className={`step-breadcrumb__step${stateClass}`}>
              <span className="step-breadcrumb__num">
                {isDone ? '✓' : stepNumber}
              </span>
              {label}
            </span>
          </span>
        )
      })}
    </div>
  )
}
