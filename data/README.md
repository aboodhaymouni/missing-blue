# data/ — reserved for the data repository

This folder is where the separate data repository goes once the team moves the raw data out (for example `git submodule add <data-repo-url> data`, or a plain clone).
Everything in here except this README is git-ignored, so nothing large or restricted lands in the app repository by accident.

Expected layout, matching the script defaults described in [`../DATA.md`](../DATA.md):

```
data/
  water/      ← today C:/xampp/htdocs/FORCAST/water   (MB_WATER_DATA)
  drive/      ← today D:/forcast/water                (MB_DATA_DRIVE)
  imagery/    ← today D:/forcast/water/imagery        (MB_IMAGERY)
```

Then, from the repository root:

```bash
MB_WATER_DATA=data/water MB_DATA_DRIVE=data/drive MB_IMAGERY=data/imagery python scripts/build_dashboard_data.py
```
