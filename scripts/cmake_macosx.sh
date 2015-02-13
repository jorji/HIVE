#!/bin/sh

# Assume mpicc has been installed with `brew install openmpi`

CXX=mpicxx CC=mpicc cmake -H. -Bbuild -DHIVE_BUILD_WITH_MPI=On -DHIVE_BUILD_WITH_CDMLIB=On