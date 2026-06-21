# Troubleshooting: LibreOffice headless rendering

## Symptom: managed `soffice` fails or is unavailable
Cowork supplies LibreOffice inside the versioned runtime and exposes only `COWORK_RUNTIME_SOFFICE`. The launcher forces headless/invisible operation, uses a disposable profile, disables synchronous printer detection, and rejects interactive or printing options.

## Fix (recommended): use the packaged renderer script
Use the canonical helper (`render_docx.py`). It resolves `COWORK_RUNTIME_SOFFICE` and captures stdout/stderr so failures are diagnosable.

```bash
python render_docx.py /mnt/data/input.docx --output_dir /mnt/data/out
# macOS/Cowork desktop: set TMPDIR before Python starts
env TMPDIR=/private/tmp python render_docx.py /mnt/data/input.docx --output_dir /mnt/data/out
# If you're debugging a conversion failure:
python render_docx.py /mnt/data/input.docx --output_dir /mnt/data/out --verbose
```

## Fix (manual): use the policy launcher
If you must test conversion directly, invoke the managed launcher explicitly:

```bash
OUTDIR=/mnt/data/out
INPUT=/mnt/data/input.docx
mkdir -p "$OUTDIR"
"$COWORK_RUNTIME_SOFFICE" --convert-to pdf --outdir "$OUTDIR" "$INPUT"
```

## About scary stderr on "successful" conversions
LibreOffice sometimes prints scary-looking messages (notably `error : Unknown IO error`) even when the output PDF is correct.

Prefer these success criteria over stderr:
- command completes
- downstream PNGs exist and look correct

## If you still get weird behavior
- Confirm `COWORK_RUNTIME_SOFFICE` points inside the active `~/.cowork/runtime/<date>` directory.
- Run the application's runtime diagnostic; it performs an actual PDF conversion.
- Reinstall the active runtime or activate the retained fallback if the diagnostic fails.
- Never invoke `dependencies/libreoffice/program/soffice` directly; doing so bypasses Cowork's no-UI/no-print policy.
