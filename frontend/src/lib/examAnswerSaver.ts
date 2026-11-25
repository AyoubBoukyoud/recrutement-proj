import type { ExamAnswer } from '@/lib/languageTest';

/** Serialize each answer's saves and retain failed/newer edits until acknowledged. */
export class ExamAnswerSaver {
  private dirty = new Map<number, ExamAnswer>();
  private running = new Map<number, Promise<void>>();

  constructor(private readonly send: (id: number, answer: ExamAnswer) => Promise<unknown>) {}

  set(id: number, answer: ExamAnswer) {
    this.dirty.set(id, answer);
  }

  get hasUnsaved() {
    return this.dirty.size > 0 || this.running.size > 0;
  }

  save(id: number): Promise<void> {
    const active = this.running.get(id);
    if (active) return active;
    const work = (async () => {
      while (this.dirty.has(id)) {
        const answer = this.dirty.get(id)!;
        await this.send(id, answer);
        if (this.dirty.get(id) === answer) this.dirty.delete(id);
      }
    })();
    const tracked = work.finally(() => {
      this.running.delete(id);
    });
    this.running.set(id, tracked);
    return tracked;
  }

  async flush(): Promise<void> {
    while (this.hasUnsaved) {
      await Promise.all([...new Set([...this.dirty.keys(), ...this.running.keys()])].map((id) => this.save(id)));
    }
  }
}
