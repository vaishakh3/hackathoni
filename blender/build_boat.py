"""Entry point for the detailed Hackathoni model.
First run: node blender/make_screens.mjs
Then run this script with Blender --background --python.
"""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().with_name('rebuild_boat.py')),run_name='__main__')
runpy.run_path(str(Path(__file__).resolve().with_name('shape_kettuvallam.py')),run_name='__main__')
runpy.run_path(str(Path(__file__).resolve().with_name('character_portraits.py')),run_name='__main__')
runpy.run_path(str(Path(__file__).resolve().with_name('finish_boat.py')),run_name='__main__')
runpy.run_path(str(Path(__file__).resolve().with_name('cinematic_boat.py')),run_name='__main__')
runpy.run_path(str(Path(__file__).resolve().with_name('optimize_export.py')),run_name='__main__')
