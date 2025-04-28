"use client";

import { APPBAR_HEIGHT } from "@/components/appbar";
import { useServer } from "@/components/server-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/components/settings-provider";

export default function Page() {
  const { libraries, disabledLibraries, toggleDisableLibrary } = useServer();
  const { updateDisableClearLogo, disableClearLogo } = useSettings();

  return (
    <div
      className={`w-full flex flex-col items-start justify-start p-4`}
      style={{ marginTop: APPBAR_HEIGHT }}
    >
      <h1 className="text-xl font-semibold tracking-wide leading-10">
        Settings
      </h1>
      <section className="py-2.5 space-y-4">
        <h2 className="text-base font-semibold">Libraries</h2>
        {libraries.map((section) => (
          <Label
            className="flex gap-2 items-center font-semibold"
            key={section.title}
          >
            <Checkbox
              defaultChecked={!disabledLibraries[section.title]}
              onCheckedChange={(checked) => toggleDisableLibrary(section.title)}
            />
            {section.title}
          </Label>
        ))}
      </section>
      <section className="py-2.5 space-y-4">
        <h2 className="text-base font-semibold">Misc</h2>
        <Label className="flex gap-2 items-center font-semibold">
          <Checkbox
            defaultChecked={disableClearLogo}
            onCheckedChange={(checked) => updateDisableClearLogo(!!checked)}
          />
          Disable clear logos
        </Label>
      </section>
    </div>
  );
}
