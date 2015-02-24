#ifndef _BUFFERVECTORDATA_H_
#define _BUFFERVECTORDATA_H_

#include "Ref.h"

class Vec3Buffer;
class Vec2Buffer;
class FloatBuffer;
class UintBuffer;

class BufferVectorData : public RefCount
{
private:
    class Impl;
    Impl* m_imp;
    
public:
    BufferVectorData(BufferVectorData* inst);
    BufferVectorData();
    ~BufferVectorData();
    void Create(int vertexnum);
    void Clear();
    void print();
    Vec3Buffer*  Position() ;
    Vec3Buffer*  Position() const;
    Vec3Buffer*  Direction() ;
    Vec3Buffer*  Direction() const;
};

#endif //_BUFFERVECTORDATA_H_

