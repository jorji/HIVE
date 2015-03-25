/**
 * @file GenTexture_Lua.h
 * GenTexture Luaラッパー
 */
#ifndef _GENTEXTURE_LUA_H_
#define _GENTEXTURE_LUA_H_

#include "LuaUtil.h"
#include "../Image/GenTexture.h"
#include "BufferImageData_Lua.h"
/**
 * GenTexture Luaラッパー
 */
class GenTexture_Lua : public GenTexture
{
public:
	enum
	{
		TYPE_NONE = 0,
		TYPE_RGBA8,
		TYPE_F32,
		TYPE_RGBA32,
		TYPE_MAX,
	};
	GenTexture_Lua() {}
	~GenTexture_Lua() {}

	bool Create2D(LuaTable tbl, int type, int width, int height) { 
		if(tbl.GetType() != LuaTable::TYPE_ARRAY) {
			printf("Cant Convert texture from lua table\n");
			return false;
		}

		//otameshi RGBA
		std::vector<unsigned char> buf;
		std::vector<LuaTable>           lt       = tbl.GetTable();
		std::vector<LuaTable>::iterator ite      = lt.begin();
		std::vector<LuaTable>::iterator ite_end  = lt.end();
		int count = 0;
		while(ite != ite_end) {
			double param = ite->GetNumber();
			buf.push_back(param);
			ite++;
			count++;
		}
		printf("size = %d\n", lt.size());
		printf("count = %d\n", count);
		printf("width = %d\n", width);
		printf("height = %d\n", height);
		printf("len = %d\n", buf.size());
		return GenTexture::Create2D_RGBA8(&buf[0], width, height);
	}

	BufferImageData_Lua* ImageData() {
		return new BufferImageData_Lua(GenTexture::ImageData());
	}

	LUA_SCRIPTCLASS_BEGIN(GenTexture_Lua)
	LUA_SCRIPTCLASS_METHOD_ARG4(bool,Create2D,LuaTable,int,int,int)
	LUA_SCRIPTCLASS_METHOD_ARG0(BufferImageData_Lua*,ImageData)
	LUA_SCRIPTCLASS_END()

};
LUA_SCRIPTCLASS_CAST_AND_PUSH(GenTexture_Lua);

#endif //_GENTEXTURE_LUA_H_

