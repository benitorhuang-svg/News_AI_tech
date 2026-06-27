import { mountRadar } from '@/render/radar'
import { mountVendorBattle } from '@/render/vendor-battle'

export function mountComparison(root: HTMLElement): void {
  root.innerHTML = `
    <section id="skill-comparison"></section>
    <section class="content-section" id="vendor-comparison"></section>
  `

  const skillComparison = root.querySelector<HTMLElement>('#skill-comparison')
  const vendorComparison = root.querySelector<HTMLElement>('#vendor-comparison')

  if (skillComparison) mountRadar(skillComparison)
  if (vendorComparison) mountVendorBattle(vendorComparison)
}
