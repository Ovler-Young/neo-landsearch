import { Button } from "@/components/ui/button";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManualDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>使用说明</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1325px] h-full">
        <DialogHeader>
          <DialogTitle>使用指南</DialogTitle>
        </DialogHeader>
        <iframe
          frameBorder="0"
          height="100%"
          width="100%"
          className="w-full"
          style={{
            height: "calc(100vh - 100px)",
          }}
          src="/manual.html"
        />
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
