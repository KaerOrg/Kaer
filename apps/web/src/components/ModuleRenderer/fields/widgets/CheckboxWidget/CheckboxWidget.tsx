export function CheckboxWidget() {
  return (
    <label className="fw-checkbox">
      <input type="checkbox" disabled className="fw-checkbox__input" />
      <span className="fw-checkbox__label">Non accompli</span>
    </label>
  )
}
