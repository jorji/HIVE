
#include <string>
#include "BaseBuffer.h"
#include "../RenderObject/Camera.h"
#include "../RenderObject/RenderObject.h"
#include "../Buffer/Buffer.h"
#include "../Buffer/BufferImageData.h"

#include "Commands.h"

BaseBuffer::BaseBuffer(RENDER_MODE mode)
: m_mode(mode), m_prog(0)
{
}
BaseBuffer::~BaseBuffer()
{
    // delete -> m_prog
}


void BaseBuffer::BindProgram() const
{
    BindProgram_SGL(m_prog);
}
void BaseBuffer::Uniform2fv(const char* name, const float* val) const
{
    SetUniform2fv_SGL(m_prog, name, val);
}
void BaseBuffer::Uniform4fv(const char* name, const float* val) const
{
    SetUniform4fv_SGL(m_prog, name, val);
}
void BaseBuffer::SetCamera(const Camera* camera) const
{
    const Camera::CameraInfo* info = camera->GetCameraInfo();
    
    // TODO:
    //if (camera->CameraType() == TYPE_STEREO) {
    //  SetStereoEnvCamera_SGL(prog, info->eye, info->tar, info->up, 20.0f, 0.03f); // fixme
    //else
    SetCamera_SGL(m_prog, info->eye, info->tar, info->up, info->fov);
}

void BaseBuffer::UnbindProgram() const
{
    //BindProgram_SGL(0);
}

void BaseBuffer::bindUniforms(const RenderObject* obj) const
{
    const unsigned int prg = getProgram();
    const VX::Math::matrix& mat = obj->GetTransformMatrix();
    SetUniformMatrix_SGL(prg, "lsgl_World", &mat.f[0]);

    // For a convenience, we add inverse and inverse transpose of world matrix to uniform shader variable.
    {
        VX::Math::matrix invmat = Inverse(mat);
        SetUniformMatrix_SGL(prg, "lsgl_WorldInverse", &invmat.f[0]);
    }

    {
        VX::Math::matrix ivtmat = Transpose(Inverse(mat));
        SetUniformMatrix_SGL(prg, "lsgl_WorldInverseTranspose", &ivtmat.f[0]);
    }

    
    
    const RenderObject::Vec4Map& vec4array = obj->GetUniformVec4();
    RenderObject::Vec4Map::const_iterator it4, eit4 = vec4array.end();
    for (it4 = vec4array.begin(); it4 != eit4; ++it4) {
        const VX::Math::vec4& v4 = it4->second;
        SetUniform4fv_SGL(prg, it4->first.c_str(), (const float*)&v4);
    }
    const RenderObject::Vec3Map& vec3array = obj->GetUniformVec3();
    RenderObject::Vec3Map::const_iterator it3, eit3 = vec3array.end();
    for (it3 = vec3array.begin(); it3 != eit3; ++it3) {
        const VX::Math::vec4& v3 = it3->second;
        SetUniform3fv_SGL(prg, it3->first.c_str(), (const float*)&v3);
    }
    const RenderObject::Vec2Map& vec2array = obj->GetUniformVec2();
    RenderObject::Vec2Map::const_iterator it2, eit2 = vec2array.end();
    for (it2 = vec2array.begin(); it2 != eit2; ++it2) {
        const VX::Math::vec4& v2 = it2->second;
        SetUniform2fv_SGL(prg, it2->first.c_str(), (const float*)&v2);
    }
    const RenderObject::FloatMap& floatarray = obj->GetUniformFloat();
    RenderObject::FloatMap::const_iterator itf, eitf = floatarray.end();
    for (itf = floatarray.begin(); itf != eitf; ++itf) {
        const float vf = itf->second;
        SetUniform1f_SGL(prg, itf->first.c_str(), vf);
    }
    
    int textureCount = 1; // start from 1. 0 is default texture. Ex: volume texture.
    const RenderObject::TextureMap& texarray = obj->GetUniformTexture();
    RenderObject::TextureMap::const_iterator itt, eitt = texarray.end();
    for (itt = texarray.begin(); itt != eitt; ++itt) {
        const BufferImageData* vt = itt->second;
        const int texid = getTextureId(vt);
        if (texid > 0) {
            ActiveTexture_SGL(textureCount);
            BindTexture2D_SGL(texid);
            SetUniform1i_SGL(prg, itt->first.c_str(), textureCount);
            ++textureCount;
            ActiveTexture_SGL(0);
        }
    }

}

//-------------------------------------------------------------------

bool BaseBuffer::loadShaderSrc(const char* srcname)
{
    return CreateProgramSrc_SGL(srcname, m_prog);
}

unsigned int BaseBuffer::getProgram() const
{
    return m_prog;
}

const unsigned int BaseBuffer::getTextureId(const BufferImageData* buf) const
{
    std::map<const BufferImageData*, unsigned int>::const_iterator it = m_texutecache.find(buf);
    if (it == m_texutecache.end()) {
        return 0;
    }
    return it->second;
}

bool BaseBuffer::cacheTexture(const BufferImageData *buf)
{
    std::map<const BufferImageData*, unsigned int>::const_iterator it = m_texutecache.find(buf);
    if (it != m_texutecache.end()) {
        return true;
    } else {
        unsigned int tex;
        GenTextures_SGL(1, &tex);
        BindTexture2D_SGL(tex);
        
        const BufferImageData::FORMAT fmt = buf->Format();
        
        assert(fmt == BufferImageData::RGBA8); // TODO: SUPPORT others
        int component = 4;  // TODO: get size from buf->Format();
        
        // TODO: more format
        TexImage2D_SGL(buf->Width(), buf->Height(), component, buf->ImageBuffer()->GetBuffer());
        
        m_texutecache[buf] = tex; //cache
        return true;
    }
}

