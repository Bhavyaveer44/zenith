import Link from "next/link";
import { CRISIS_RESOURCES } from "@/lib/safety/resources";

export function CrisisCard() {
  return (
    <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-5">
      <h3 className="mb-3 font-semibold">Please talk to a real person now</h3>
      <div className="space-y-3 text-sm">
        {CRISIS_RESOURCES.slice(0, 2).map((group) => (
          <div key={group.region}>
            <p className="font-medium">{group.region}</p>
            <ul className="text-muted-foreground">
              {group.lines.map((line) => (
                <li key={line.name}>
                  {line.name}: <span className="font-medium text-foreground">{line.contact}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p>
          <Link href="/crisis-resources" className="underline">
            All resources, including international →
          </Link>
        </p>
        <p className="text-muted-foreground">
          This session is paused. Zenith is not equipped to help in a crisis —
          and you deserve more than an app right now.
        </p>
      </div>
    </div>
  );
}
