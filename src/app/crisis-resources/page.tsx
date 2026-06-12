import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRISIS_RESOURCES } from "@/lib/safety/resources";

export const metadata = { title: "Crisis resources — Zenith" };

export default function CrisisResourcesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Crisis resources
        </h1>
        <p className="text-muted-foreground">
          If you are thinking about harming yourself, are worried you might
          hurt someone, or are in danger — please contact one of these now.
          They are free, confidential, and staffed by real people.
        </p>
      </div>
      <div className="space-y-4">
        {CRISIS_RESOURCES.map((group) => (
          <Card key={group.region}>
            <CardHeader>
              <CardTitle className="text-base">{group.region}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {group.lines.map((line) => (
                  <li
                    key={line.name}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>{line.name}</span>
                    <span className="font-medium">{line.contact}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        If you are in immediate physical danger, call your local emergency
        number first.
      </p>
    </div>
  );
}
